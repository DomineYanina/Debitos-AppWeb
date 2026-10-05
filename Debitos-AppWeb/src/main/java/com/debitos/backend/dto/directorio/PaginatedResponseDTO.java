package com.debitos.backend.dto.directorio;

import java.util.Collections;
import java.util.List;

/**
 * Objeto de transferencia estructurado para paginación del servidor.
 * Compatible con controles de paginación de AG-Grid y tablas Angular.
 *
 * @param <T> Tipo de elemento de contenido
 */
public class PaginatedResponseDTO<T> {

    private List<T> content;
    private long totalElements;
    private int page;
    private int size;
    private int totalPages;
    private boolean first;
    private boolean last;

    public PaginatedResponseDTO() {
        this.content = Collections.emptyList();
    }

    public PaginatedResponseDTO(List<T> content, long totalElements, int page, int size) {
        this.content = content != null ? content : Collections.emptyList();
        this.totalElements = totalElements;
        this.page = Math.max(0, page);
        this.size = size > 0 ? size : 50;
        this.totalPages = this.size > 0 ? (int) Math.ceil((double) totalElements / this.size) : 0;
        this.first = this.page == 0;
        this.last = this.totalPages == 0 || this.page >= this.totalPages - 1;
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content != null ? content : Collections.emptyList();
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
        this.totalPages = this.size > 0 ? (int) Math.ceil((double) totalElements / this.size) : 0;
        this.last = this.totalPages == 0 || this.page >= this.totalPages - 1;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
        this.first = this.page == 0;
        this.last = this.totalPages == 0 || this.page >= this.totalPages - 1;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size > 0 ? size : 50;
        this.totalPages = this.size > 0 ? (int) Math.ceil((double) this.totalElements / this.size) : 0;
        this.last = this.totalPages == 0 || this.page >= this.totalPages - 1;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public boolean isFirst() {
        return first;
    }

    public void setFirst(boolean first) {
        this.first = first;
    }

    public boolean isLast() {
        return last;
    }

    public void setLast(boolean last) {
        this.last = last;
    }
}
