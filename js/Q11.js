// Q11.js - Bar chart phân phối lượt mua hàng của khách hàng

// --- Kích thước và lề ---
const margin = { top: 50, right: 30, bottom: 50, left: 80 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// --- Vùng vẽ SVG ---
const svg = d3.select("#Q11")
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

// --- Load CSV ---
d3.csv("ggdata.csv").then(data => {

  // --- Xử lý dữ liệu ---
  data.forEach(d => {
    d.MaKH = d["Mã khách hàng"];
    d.MaDon = d["Mã đơn hàng"];
  });

  // Đếm số đơn hàng của từng khách hàng
  const ordersPerCustomer = d3.rollup(
    data,
    v => new Set(v.map(d => d.MaDon)).size,
    d => d.MaKH
  );

  // Phân phối: số khách hàng theo số lần mua
  const distributionMap = d3.rollup(
    Array.from(ordersPerCustomer.values()),
    v => v.length,
    d => d
  );

  const distribution = Array.from(distributionMap, ([soLanMua, soKhach]) => ({
    soLanMua: +soLanMua,
    soKhach: +soKhach
  })).sort((a, b) => a.soLanMua - b.soLanMua);

  // --- Scale ---
  const x = d3.scaleBand()
              .domain(distribution.map(d => d.soLanMua))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(distribution, d => d.soKhach)])
              .nice()
              .range([height, 0]);

  // --- Trục ---
  svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x).tickFormat(d => d ));

  svg.append("g")
     .call(d3.axisLeft(y));

  // --- Vẽ cột ---
  svg.selectAll(".bar")
     .data(distribution)
     .enter()
     .append("rect")
       .attr("class", "bar")
       .attr("x", d => x(d.soLanMua))
       .attr("y", d => y(d.soKhach))
       .attr("width", x.bandwidth())
       .attr("height", d => height - y(d.soKhach))
       .attr("fill", "#69b3a2")
       .on("mouseover", function(event, d) {
         tooltip.style("opacity", 1)
                .html(`<b>Số lần mua:</b> ${d.soLanMua}<br>
                       <b>Số khách hàng:</b> ${d.soKhach}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
         d3.select(this).attr("fill", "#40a080");
       })
       .on("mousemove", function(event) {
         tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
       })
       .on("mouseout", function() {
         tooltip.style("opacity", 0);
         d3.select(this).attr("fill", "#69b3a2");
       });

  // --- Tiêu đề ---
  svg.append("text")
     .attr("x", width / 2)
     .attr("y", -20)
     .attr("text-anchor", "middle")
     .style("font-size", "16px")
     .style("font-weight", "bold");

  // Nhãn trục X
  svg.append("text")
     .attr("x", width / 2)
     .attr("y", height + 40)
     .attr("text-anchor", "middle")
     .style("font-size", "14px");

  // Nhãn trục Y
  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("x", -height / 2)
     .attr("y", -50)
     .attr("text-anchor", "middle")
     .style("font-size", "14px");
});
