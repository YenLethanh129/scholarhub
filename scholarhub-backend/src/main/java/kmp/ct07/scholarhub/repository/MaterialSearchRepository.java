package kmp.ct07.scholarhub.repository;

import kmp.ct07.scholarhub.document.MaterialDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialSearchRepository extends ElasticsearchRepository<MaterialDocument, String> {
}
