/**
 * Xóa dấu tiếng Việt khỏi chuỗi
 * @param str - Chuỗi cần xử lý
 * @returns Chuỗi không dấu
 * @example
 * removeVietnameseTones("Danh sách Đề tài") → "Danh sach De tai"
 */
export const removeVietnameseTones = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD") // Tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, "") // Xóa sạch các dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D"); // Xử lý riêng chữ đ
};

/**
 * Tìm tất cả vị trí của một query trong text (bỏ qua dấu tiếng Việt & chữ hoa/thường)
 * @param text - Text gốc (có dấu)
 * @param query - Query tìm kiếm (có thể có/không dấu, chữ hoa/thường)
 * @returns Mảng các đối tượng {start, end, text} chỉ ra phần cần highlight
 * @example
 * findToneInsensitiveMatches("Danh sách Đề tài", "danh sach")
 * → [{start: 0, end: 9, text: "Danh sách"}]
 */
export const findToneInsensitiveMatches = (
  text: string,
  query: string,
): Array<{ start: number; end: number; text: string }> => {
  if (!query || !text) return [];

  const textWithoutTones = removeVietnameseTones(text).toLowerCase();
  const queryWithoutTones = removeVietnameseTones(query).toLowerCase();

  const matches: Array<{ start: number; end: number; text: string }> = [];
  let startIndex = 0;

  while (true) {
    const index = textWithoutTones.indexOf(queryWithoutTones, startIndex);
    if (index === -1) break;

    matches.push({
      start: index,
      end: index + query.length,
      text: text.substring(index, index + query.length),
    });

    startIndex = index + 1;
  }

  return matches;
};
