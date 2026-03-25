package kmp.ct07.scholarhub.service;

import kmp.ct07.scholarhub.event.DeleteDocumentEvent;
import kmp.ct07.scholarhub.event.IndexDocumentEvent;

public interface IIndexingService {
    void handleIndexDocumentEvent(IndexDocumentEvent event);

    int rebuildMaterialsIndex();

    void handleDeleteDocumentEvent(DeleteDocumentEvent event);
}
