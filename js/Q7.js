// Q7.js

// Kích thước và lề
const margin = { top: 40, right: 30, bottom: 50, left: 200 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Vùng vẽ
const svg = d3.select("#Q7")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("border-radius", "6px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("opacity", 0);

d3.csv("ggdata.csv").then(data => {
  data.forEach(d => {
    d.MaDon = d["Mã đơn hàng"];
    d.MaNhom = d["Mã nhóm hàng"];
    d.TenNhom = d["Tên nhóm hàng"];
  });

  // Tổng số đơn hàng duy nhất
  const tongDonHang = new Set(data.map(d => d.MaDon)).size;

  // Gom theo nhóm hàng → tính số đơn hàng duy nhất
  const nhomMap = d3.rollups(
    data,
    v => new Set(v.map(d => d.MaDon)).size,
    d => "[" + d.MaNhom + "] " + d.TenNhom
  ).map(([Nhom, SoDon]) => ({
    Nhom,
    XacSuat: SoDon / tongDonHang
  }));

  // Sắp xếp giảm dần
  nhomMap.sort((a, b) => d3.descending(a.XacSuat, b.XacSuat));

  // Scale X
  const x = d3.scaleLinear()
              .domain([0, d3.max(nhomMap, d => d.XacSuat)])
              .range([0, width]);

  // Scale Y
  const y = d3.scaleBand()
              .domain(nhomMap.map(d => d.Nhom))
              .range([0, height])
              .padding(0.2);


  // Trục X (0%, 10%, ..., 100%)
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
            .tickValues(d3.range(0, 1.01, 0.1))  // 0 → 1 với bước 0.1
            .tickFormat(d3.format(".0%")));


  // Trục Y
  svg.append("g")
    .call(d3.axisLeft(y));

  // Vẽ cột (schemeCategory10 giống Q6, KHÔNG highlight khi hover)
  svg.selectAll(".bar")
    .data(nhomMap)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.Nhom))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.XacSuat))
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", 1)
               .html(`<b>Nhóm hàng:</b> ${d.Nhom}<br>
                      <b>Xác suất:</b> ${(d.XacSuat*100).toFixed(2)}%`)
               .style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 20) + "px");
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });

  // Label phần trăm trong bar
  svg.selectAll(".label")
    .data(nhomMap)
    .enter()
    .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.XacSuat) - 5)
      .attr("y", d => y(d.Nhom) + y.bandwidth()/2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .style("fill", "white")
      .style("font-size", "12px")
      .text(d => (d.XacSuat*100).toFixed(1) + "%");
});
