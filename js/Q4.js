
// Kích thước và lề
const margin = { top: 20, right: 30, bottom: 50, left: 100 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Vùng vẽ
const svg = d3.select("#Q4")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
    .attr("class", "tooltip")
    .style("position","absolute")
    .style("background","#fff")
    .style("padding","6px 10px")
    .style("border","1px solid #ccc")
    .style("border-radius","4px")
    .style("pointer-events","none")
    .style("font-size","12px")
    .style("opacity",0);

// Hàm format số có dấu phẩy
function formatNumberComma(x) {
  return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Parse datetime
const parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

// Đọc dữ liệu
d3.csv("ggdata.csv").then(raw => {
  raw.forEach(d => {
    d.Ngay = parseDateTime(d["Thời gian tạo đơn"]);
    d.DoanhThu = +d["Thành tiền"];
  });

  // Gom doanh thu theo ngày (YYYY-MM-DD)
  const doanhThuNgay = d3.rollups(
    raw,
    v => d3.sum(v, d => d.DoanhThu),
    d => d3.timeFormat("%Y-%m-%d")(d.Ngay)
  ).map(([Ngay, TongDoanhThu]) => ({
    Ngay: d3.timeParse("%Y-%m-%d")(Ngay),
    TongDoanhThu
  }));

  // Gom theo ngày trong tuần → tính trung bình
  const thuMap = d3.rollups(
    doanhThuNgay,
    v => ({
      Tong: d3.sum(v, d => d.TongDoanhThu),
      Count: v.length
    }),
    d => d.Ngay.getDay()
  ).map(([Thu, obj]) => ({
    Thu,
    DoanhThuTB: obj.Tong / obj.Count
  }));

  // Mapping số -> tên thứ
  const thuVN = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"];
  const data = thuMap.map(d => ({
    Thu: thuVN[d.Thu],
    DoanhThuTB: d.DoanhThuTB
  }));

  // Thứ tự chuẩn (Thứ Hai -> Chủ Nhật)
  const order = ["Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy","Chủ Nhật"];
  data.sort((a, b) => order.indexOf(a.Thu) - order.indexOf(b.Thu));

  // Scale X
  const x = d3.scaleBand()
              .domain(order)
              .range([0, width])
              .padding(0.05);

  // Scale Y với bước 5M
  const yMax = d3.max(data, d => d.DoanhThuTB);
  const yDomain = Math.ceil(yMax / 5000000) * 5000000;

  const y = d3.scaleLinear()
              .domain([0, yDomain])
              .nice()
              .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeTableau10).domain(order);

  // Trục X
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Trục Y (0, 5M, 10M, ...)
  svg.append("g")
    .call(d3.axisLeft(y)
            .ticks(yDomain / 5000000)
            .tickFormat(d => (d/1e6) + "M"));

  // Vẽ cột
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
      .attr("x", d => x(d.Thu))
      .attr("y", d => y(d.DoanhThuTB))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThuTB))
      .attr("fill", d => color(d.Thu))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity",0.9);
        tooltip.html(`
          <strong>${d.Thu}</strong><br/>
          Doanh thu TB: ${formatNumberComma(d.DoanhThuTB)} VNĐ
        `);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity",0));

  // Label trong bar
  svg.selectAll("text.label")
    .data(data)
    .enter()
    .append("text")
      .attr("x", d => x(d.Thu) + x.bandwidth()/2)
      .attr("y", d => y(d.DoanhThuTB) + 15)
      .attr("text-anchor","middle")
      .text(d => formatNumberComma(d.DoanhThuTB)+ " VNĐ")
      .style("font-size","12px")
      .style("fill","white");
});
