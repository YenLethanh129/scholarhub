package kmp.ct07.scholarhub.controller;

import kmp.ct07.scholarhub.document.MaterialDocument;
import kmp.ct07.scholarhub.response.BaseResponse;
import kmp.ct07.scholarhub.security.UserDetailsImpl;
import kmp.ct07.scholarhub.service.IIndexingService;
import kmp.ct07.scholarhub.service.IMaterialSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {
    private final IMaterialSearchService searchService;
    private final IIndexingService indexingService;

    @GetMapping
    public ResponseEntity<?> searchMaterials(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long minSize,
            @RequestParam(required = false) Long maxSize,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        Pageable pageable = PageRequest.of(page, size);

        List<MaterialDocument> results = searchService.searchMaterials(
                currentUser.getId(), keyword, type, minSize, maxSize, fromDate, toDate, pageable
        );

        return ResponseEntity.ok()
                .body(BaseResponse.<List<MaterialDocument>>builder()
                        .message("Đã tìm kiếm thành công!")
                        .data(results)
                        .build());
    }

    @PostMapping("/rebuild-index")
    public ResponseEntity<?> rebuildMaterialsIndex() {
        int indexedCount = indexingService.rebuildMaterialsIndex();

        Map<String, Object> response = new HashMap<>();
        response.put("indexedCount", indexedCount);

        return ResponseEntity.ok()
                .body(BaseResponse.<Map<String, Object>>builder()
                        .message("Đã dọn và rebuild index materials thành công")
                        .data(response)
                        .build());
    }
}
