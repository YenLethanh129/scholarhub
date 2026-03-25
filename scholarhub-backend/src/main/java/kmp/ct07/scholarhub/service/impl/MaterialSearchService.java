package kmp.ct07.scholarhub.service.impl;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import kmp.ct07.scholarhub.document.MaterialDocument;
import kmp.ct07.scholarhub.service.IMaterialSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialSearchService implements IMaterialSearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    @Override
    public List<MaterialDocument> searchMaterials(UUID currentUserId, String keyword, String fileType, Long minSize, Long maxSize, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {

        BoolQuery.Builder boolQuery = QueryBuilders.bool();

        if (StringUtils.hasText(keyword)) {
            boolQuery.must(m -> m
                    .multiMatch(mm -> mm
                            .query(keyword)
                            .fields("title^3", "tags^2", "metadata"))
            );
        }

        if (StringUtils.hasText(fileType)) {
            boolQuery.filter(f -> f
                    .term(t -> t
                            .field("type")
                            .value(fileType))
            );
        }

        if (minSize != null || maxSize != null) {
            boolQuery.filter(f -> f
                    .range(r -> r
                            .number(n -> {
                                n.field("size");
                                if (minSize != null) n.gte(minSize.doubleValue());
                                if (maxSize != null) n.lte(maxSize.doubleValue());
                                return n;
                            })
                    )
            );
        }

        if (fromDate != null || toDate != null) {
            boolQuery.filter(f -> f
                    .range(r -> r
                            .date(d -> {
                                d.field("createdAt");
                                if (fromDate != null) d.gte(fromDate.toString());
                                if (toDate != null) d.lte(toDate.toString());
                                return d;
                            })
                    )
            );
        }

        Query query = NativeQuery.builder()
                .withQuery(boolQuery.build()._toQuery())
                .withPageable(pageable)
                .build();

        SearchHits<MaterialDocument> searchHit = elasticsearchOperations.search(query, MaterialDocument.class);

        return searchHit.stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());
    }
}
