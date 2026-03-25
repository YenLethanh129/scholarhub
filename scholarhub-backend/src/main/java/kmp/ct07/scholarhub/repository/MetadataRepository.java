package kmp.ct07.scholarhub.repository;

import kmp.ct07.scholarhub.entity.mongodb.FileMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MetadataRepository extends MongoRepository<FileMetadata, String> {
	Optional<FileMetadata> findByMaterialId(UUID materialId);

	Optional<FileMetadata> findByObjectKey(String objectKey);
}
