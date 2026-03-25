package kmp.ct07.scholarhub.service.impl;

import org.springframework.transaction.annotation.Transactional;
import kmp.ct07.scholarhub.entity.Folder;
import kmp.ct07.scholarhub.entity.Material;
import kmp.ct07.scholarhub.entity.User;
import kmp.ct07.scholarhub.enums.ErrorCode;
import kmp.ct07.scholarhub.exception.AppException;
import kmp.ct07.scholarhub.repository.FolderRepository;
import kmp.ct07.scholarhub.repository.MaterialRepository;
import kmp.ct07.scholarhub.repository.UserRepository;
import kmp.ct07.scholarhub.response.FolderContentResponse;
import kmp.ct07.scholarhub.response.FolderTreeResponse;
import kmp.ct07.scholarhub.response.MaterialResponse;
import kmp.ct07.scholarhub.service.IFolderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FolderService implements IFolderService {
    private final FolderRepository folderRepository;
    private final MaterialRepository materialRepository;
    private final MaterialService materialService;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    @Override
    public List<FolderTreeResponse> getUserFolderTree(UUID userId) {
        String cacheKey = "folder_tree:" + userId.toString();
        List<FolderTreeResponse> cachedTree = (List<FolderTreeResponse>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedTree != null) {
            return cachedTree;
        }

        List<Folder> flatFolders = folderRepository.findAllFoldersTreeByUserId(userId);

        Map<UUID, FolderTreeResponse> folderMap = new HashMap<>();
        List<FolderTreeResponse> rootFolders = new ArrayList<>();

        for (Folder f : flatFolders) {
            FolderTreeResponse response = new FolderTreeResponse();
            response.setId(f.getId());
            response.setName(f.getName());
            response.setChildren(new ArrayList<>());

            if (f.getParent() != null) {
                response.setParentId(f.getParent().getId());
            } else {
                response.setParentId(null);
            }

            folderMap.put(f.getId(), response);
        }

        for (FolderTreeResponse response : folderMap.values()) {
            if (response.getParentId() == null) {
                rootFolders.add(response);
            } else {
                FolderTreeResponse parent = folderMap.get(response.getParentId());
                if (parent != null) {
                    parent.getChildren().add(response);
                }
            }
        }

        redisTemplate.opsForValue().set(cacheKey, rootFolders, CACHE_TTL);

        return rootFolders;
    }

    @Override
    @Transactional(readOnly = true)
    public FolderContentResponse getFolderContents(UUID userId, UUID folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException(ErrorCode.FOLDER_NOT_FOUND));

        if (!folder.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<Folder> childFolders = folderRepository.findByParentIdAndUserIdAndIsDeletedFalse(folderId, userId);
        List<FolderContentResponse.FolderItem> folderItems = childFolders.stream()
                .map(FolderContentResponse.FolderItem::fromEntity)
                .collect(Collectors.toList());

        List<Material> materials = materialRepository.findByFolderIdAndOwnerId(folderId, userId);
        List<MaterialResponse> materialResponses = materials.stream()
                .map(MaterialResponse::fromEntity)
                .collect(Collectors.toList());

        return FolderContentResponse.builder()
                .folders(folderItems)
                .materials(materialResponses)
                .build();
    }

    @Override
    public FolderContentResponse getRootFolderContents(UUID userId) {
        List<Folder> rootFolders = folderRepository.findByParentIsNullAndUserIdAndIsDeletedFalse(userId);
        List<FolderContentResponse.FolderItem> folderItems = rootFolders.stream()
                .map(FolderContentResponse.FolderItem::fromEntity)
                .collect(Collectors.toList());

        List<Material> materials = materialRepository.findByFolderIdIsNullAndOwnerId(userId);
        List<MaterialResponse> materialResponses = materials.stream()
                .map(MaterialResponse::fromEntity)
                .collect(Collectors.toList());

        return FolderContentResponse.builder()
                .folders(folderItems)
                .materials(materialResponses)
                .build();
    }

    @Override
    @Transactional
    public void createFolder(UUID userId, String folderName, UUID parentFolderId) {
        // Kiem tra trung ten trong cung 1 thu muc cha
        boolean existingFolder = folderRepository.existByNameAndParentIdAndUserId(folderName, parentFolderId, userId);
        if (existingFolder) {
            throw new AppException(ErrorCode.FOLDER_NAME_EXISTED);
        }

        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Folder pareentFolder = null;
        if (parentFolderId != null) {
            pareentFolder = folderRepository.findById(parentFolderId)
                    .orElseThrow(() -> new AppException(ErrorCode.PARENT_FOLDER_NOT_FOUND));
        }

        Folder newFolder = Folder.builder()
                .name(folderName)
                .user(existingUser)
                .parent(pareentFolder)
                .build();

        folderRepository.save(newFolder);
        clearFolderTreeCache(userId);
    }

    @Override
    @Transactional
    public void renameFolder(UUID userId, UUID folderId, String newName) {
        Folder folderToRename = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException(ErrorCode.FOLDER_NOT_FOUND));

        if (!folderToRename.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        UUID currentParentId = folderToRename.getParent() != null ? folderToRename.getParent().getId() : null;

        // Fix Lỗi 3: Không kiểm tra trùng tên với chính nó và kiểm tra đúng cấp thư mục
        if (!folderToRename.getName().equals(newName)) {
            boolean isExist = folderRepository.existByNameAndParentIdAndUserId(newName, currentParentId, userId);
            if (isExist) {
                throw new AppException(ErrorCode.FOLDER_NAME_EXISTED);
            }
            folderToRename.setName(newName);
            folderRepository.save(folderToRename);
            clearFolderTreeCache(userId);
        }

    }

    @Override
    @Transactional
    public void deleteFolder(UUID userId, UUID folderId) {
        Folder folderToDelete = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException(ErrorCode.FOLDER_NOT_FOUND));

        if (!folderToDelete.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        markFolderAsDeleted(folderToDelete);
        clearFolderTreeCache(userId);
    }

    @Override
    public void moveFolder(UUID userId, UUID folderId, UUID newParentFolderId) {
        Folder folderToMove = folderRepository.findById(folderId)
                .orElseThrow(() -> new AppException(ErrorCode.FOLDER_NOT_FOUND));

        boolean existingFolder = folderRepository.existByNameAndParentIdAndUserId(folderToMove.getName(), newParentFolderId, userId);
        if (existingFolder) {
            throw new AppException(ErrorCode.FOLDER_NAME_EXISTED);
        }

        if (!folderToMove.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (newParentFolderId != null) {
            if (isDescendant(folderToMove.getId(), newParentFolderId)) {
                throw new AppException(ErrorCode.FOLDER_RECURSIVE);
            }

            Folder newParentFolder = folderRepository.findById(newParentFolderId)
                    .orElseThrow(() -> new AppException(ErrorCode.PARENT_FOLDER_NOT_FOUND));

            if (!newParentFolder.getUser().getId().equals(userId)) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            folderToMove.setParent(newParentFolder);
        } else {
            folderToMove.setParent(null);
        }

        folderRepository.save(folderToMove);
        clearFolderTreeCache(userId);
    }

    @Override
    public void clearFolderTreeCache(UUID userId) {
        String cacheKey = "folder_tree:" + userId.toString();
        redisTemplate.delete(cacheKey);
    }

    private void markFolderAsDeleted(Folder folder) {
        materialService.deleteMaterialsInFolder(folder.getId());
        List<Folder> childFolders = folderRepository.findByParentId(folder.getId());
        for (Folder child : childFolders) {
            markFolderAsDeleted(child);
        }

        folderRepository.delete(folder);
    }

    private boolean isDescendant(UUID folderId, UUID newParentFolderId) {
        if (newParentFolderId == null) return false;

        Folder current = folderRepository.findById(newParentFolderId)
                .orElseThrow(() -> new AppException(ErrorCode.FOLDER_NOT_FOUND));

        while (current != null) {
            if (current.getId().equals(folderId)) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }
}
