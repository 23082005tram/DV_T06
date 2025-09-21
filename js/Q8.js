// Q8.js - Line chart xác suất bán hàng theo tháng

// --- Kích thước và lề ---
const margin = { top: 50, right: 150, bottom: 50, left: 80 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// --- Vùng vẽ SVG ---
const svg = d3.select("#Q8")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// --- Tooltip ---
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "#f9f9f9")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("border-radius", "6px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("box-shadow", "0 0 5px #ccc");

// --- Parse thời gian ---
const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

// --- Load CSV ---
d3.csv("ggdata.csv").then(data => {

  // --- Xử lý dữ liệu ---
  data.forEach(d => {
    d.MaDon = d["Mã đơn hàng"];
    d.MaNhom = d["Mã nhóm hàng"];
    d.TenNhom = d["Tên nhóm hàng"];

    const date = parseTime(d["Thời gian tạo đơn"].trim());
    if (date) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      d.Thang = `${year}-${month}`; // để sort chính xác
      d.ThangLabel = `Tháng ${month}`; // để hiển thị
    } else {
      d.Thang = null;
      d.ThangLabel = null;
    }
  });

  // Lọc những record có tháng hợp lệ
  const filteredData = data.filter(d => d.Thang != null);

  // Danh sách tháng theo thứ tự
  const months = Array.from(new Set(filteredData.map(d => d.Thang)))
                      .sort((a,b) => new Date(a+"-01") - new Date(b+"-01"));

  // Danh sách nhóm hàng
  const groups = Array.from(new Set(filteredData.map(d => `[${d.MaNhom}] ${d.TenNhom}`)));

  // Tổng số đơn hàng mỗi tháng
  const totalOrdersPerMonth = d3.rollup(
    filteredData,
    v => new Set(v.map(d => d.MaDon)).size,
    d => d.Thang
  );

  // Tính xác suất bán hàng theo nhóm hàng và tháng
  const groupData = groups.map(g => {
    const records = months.map(m => {
      const ordersInMonth = filteredData.filter(d => (`[${d.MaNhom}] ${d.TenNhom}`) === g && d.Thang === m);
      const uniqueOrders = new Set(ordersInMonth.map(d => d.MaDon)).size;
      const totalOrders = totalOrdersPerMonth.get(m) || 1;
      return {
        Thang: m,
        ThangLabel: ordersInMonth.length > 0 ? ordersInMonth[0].ThangLabel : `Tháng ${m.split("-")[1]}`,
        XacSuat: uniqueOrders / totalOrders
      };
    });
    return { group: g, values: records };
  });

  // --- Scale ---
  const x = d3.scalePoint()
              .domain(months)
              .range([0, width])
              .padding(0.5);

  // Tìm max xác suất để set trục Y
  const maxValue = d3.max(groupData, g => d3.max(g.values, d => d.XacSuat));
  const yMax = Math.ceil(maxValue * 10) / 10; // làm tròn lên 0.1
  const y = d3.scaleLinear()
              .domain([0.2, yMax])
              .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(groups);

  // --- Trục ---
  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x).tickFormat(d => `Tháng ${d.split("-")[1]}`));

// --- Trục Y ---
// Tick từ 20% đến yMax, bước nhảy 10%
const yTicks = d3.range(0.2, yMax + 0.001, 0.1);

svg.append("g")
   .call(d3.axisLeft(y)
           .tickValues(yTicks)       // ép mốc cụ thể
           .tickFormat(d3.format(".0%")));

  // --- Line generator ---
  const line = d3.line()
                 .x(d => x(d.Thang))
                 .y(d => y(d.XacSuat));

  // --- Vẽ line ---
  svg.selectAll(".line")
     .data(groupData)
     .enter()
     .append("path")
       .attr("class", "line")
       .attr("fill", "none")
       .attr("stroke", d => color(d.group))
       .attr("stroke-width", 2)
       .attr("d", d => line(d.values));

  // --- Vẽ điểm & tooltip ---
  groupData.forEach(g => {
    svg.selectAll(".dot-" + g.group)
       .data(g.values)
       .enter()
       .append("circle")
         .attr("cx", d => x(d.Thang))
         .attr("cy", d => y(d.XacSuat))
         .attr("r", 4)
         .attr("fill", color(g.group))
         .on("mouseover", function(event, d) {
           tooltip.style("opacity", 1)
                  .html(`<b>Nhóm hàng:</b> ${g.group}<br>
                         <b>Tháng:</b> ${d.ThangLabel}<br>
                         <b>Xác suất:</b> ${(d.XacSuat*100).toFixed(1)}%`)
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
  });

  // --- Legend ---
  const legend = svg.append("g")
                    .attr("transform", `translate(${width + 20},0)`);

  groups.forEach((g, i) => {
    const l = legend.append("g")
                    .attr("transform", `translate(0,${i*25})`);
    l.append("rect")
     .attr("width", 18)
     .attr("height", 18)
     .attr("fill", color(g));
    l.append("text")
     .attr("x", 24)
     .attr("y", 13)
     .text(g)
     .style("font-size", "12px");
  });

});
