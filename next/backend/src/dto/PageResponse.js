'use strict';
class PageResponse {
  constructor(content, pageNumber, pageSize, totalElements, totalPages, last) {
    this.content = content;
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
    this.last = last;
  }
}
module.exports = PageResponse;
