package kmp.ct07.scholarhub.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

import java.time.LocalDateTime;
import java.util.List;

@Document(indexName = "materials")
@Setting(settingPath = "elasticsearch/settings.json")
@Data
@Builder
public class MaterialDocument {
    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "vietnamese_icu_analyzer")
    private String title;

    @Field(type = FieldType.Text, analyzer = "vietnamese_icu_analyzer")
    private String metadata;

    @Field(type = FieldType.Keyword)
    private List<String> tags;

    @Field(type = FieldType.Keyword)
    private String type;

    @Field(type = FieldType.Long)
    private Long size;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSS||uuuu-MM-dd'T'HH:mm:ss||uuuu-MM-dd")
    private LocalDateTime createdAt;

    @Field(type = FieldType.Keyword)
    private String folderId;

    @Field(type = FieldType.Keyword)
    private String ownerId;
}
