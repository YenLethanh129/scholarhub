package kmp.ct07.scholarhub.service.impl;

import kmp.ct07.scholarhub.document.MaterialDocument;
import kmp.ct07.scholarhub.entity.Material;
import kmp.ct07.scholarhub.event.DeleteDocumentEvent;
import kmp.ct07.scholarhub.event.IndexDocumentEvent;
import kmp.ct07.scholarhub.repository.MaterialRepository;
import kmp.ct07.scholarhub.repository.MaterialSearchRepository;
import kmp.ct07.scholarhub.service.IIndexingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexingService implements IIndexingService {

    private final MaterialSearchRepository searchRepository;
    private final MaterialRepository materialRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    @Override
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleIndexDocumentEvent(IndexDocumentEvent event) {
        log.info("Nhận được Event đồng bộ ES cho Material ID: {}", event.materialId());

        MaterialDocument document = MaterialDocument.builder()
                .id(event.materialId().toString())
                .title(event.title())
                .metadata(event.metadata())
                .tags(event.tags())
                .type(event.type())
                .size(event.size())
                .createdAt(event.createdAt())
                .folderId(event.folderId() != null ? event.folderId().toString() : null)
                .ownerId(event.ownerId() != null ? event.ownerId().toString() : null)
                .build();

        searchRepository.save(document);
        log.info("Đã đồng bộ ES cho Material ID: {}", event.materialId());
    }

    @Override
    @Transactional(readOnly = true)
    public int rebuildMaterialsIndex() {
        IndexOperations indexOps = elasticsearchOperations.indexOps(MaterialDocument.class);

        if (indexOps.exists()) {
            indexOps.delete();
        }

        indexOps.create();
        indexOps.putMapping(indexOps.createMapping(MaterialDocument.class));

        List<MaterialDocument> documents = materialRepository.findAll()
                .stream()
                .map(this::toMaterialDocument)
                .toList();

        searchRepository.saveAll(documents);
        log.info("Đã rebuild index materials với {} document", documents.size());
        return documents.size();
    }

    @Override
    @Async
    @EventListener
    public void handleDeleteDocumentEvent(DeleteDocumentEvent event) {
        searchRepository.deleteById(event.materialId().toString());
        log.info("Đã xóa document ES cho Material ID: {}", event.materialId());
    }

    private MaterialDocument toMaterialDocument(Material material) {
        return MaterialDocument.builder()
                .id(material.getId().toString())
                .title(material.getTitle())
                .metadata(material.getDescription() != null ? material.getDescription() : "")
                .tags(java.util.Collections.emptyList())
                .type(material.getType() != null ? material.getType().name() : null)
                .size(material.getSize())
                .createdAt(material.getCreatedAt())
                .folderId(material.getFolder() != null ? material.getFolder().getId().toString() : null)
                .ownerId(material.getOwner() != null ? material.getOwner().getId().toString() : null)
                .build();
    }
}
