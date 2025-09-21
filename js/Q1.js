// Q1.js

// Kích thước và lề
const margin = { top: 20, right: 30, bottom: 40, left: 220 },
      width = 1000 - margin.left - margin.right,   // giảm rộng lại
      height = 500 - margin.top - margin.bottom; // giảm cao lại


// Tạo vùng vẽ
const svg = d3.select("#Q1")
  .append("svg")
    .attr("width", width + margin.left + margin.right + 200) // thêm chỗ cho legend
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tạo tooltip
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

// Đọc file CSV
d3.csv("ggdata.csv").then(raw => {

  // Gom dữ liệu: mỗi sản phẩm = [Mã] Tên, tính tổng doanh thu
  const dataMap = d3.rollups(
    raw,
    v => ({
      DoanhThu: d3.sum(v, d => +d["Thành tiền"]),
      MaNhom: v[0]["Mã nhóm hàng"],
      TenNhom: v[0]["Tên nhóm hàng"]
    }),
    d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
  );

  const data = dataMap.map(([MatHang, info]) => ({ MatHang, ...info }));

  // Sắp xếp giảm dần theo doanh thu
  data.sort((a, b) => d3.descending(a.DoanhThu, b.DoanhThu));

  // Tạo scale
  const y = d3.scaleBand()
              .domain(data.map(d => d.MatHang))
              .range([0, height])
              .padding(0.1);

  const x = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.DoanhThu)])
              .nice()
              .range([0, width]);

  const color = d3.scaleOrdinal(d3.schemeTableau10)
                  .domain([...new Set(data.map(d => d.MaNhom))]);

  // Vẽ trục Y
  svg.append("g").call(d3.axisLeft(y));

  // Vẽ trục X
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickValues(d3.range(0, d3.max(data, d => d.DoanhThu) + 1e8, 1e8))
        .tickFormat(d => d/1e6 + "M")
    );

  // Vẽ cột với tooltip
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
      .attr("y", d => y(d.MatHang))
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.DoanhThu))
      .attr("fill", d => color(d.MaNhom))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity",0.9);
        tooltip.html(`
          <strong>Mặt hàng:</strong> ${d.MatHang}<br/>
          <strong>Nhóm hàng:</strong> [${d.MaNhom}] ${d.TenNhom}<br/>
          <strong>Doanh số bán:</strong> ${d.DoanhThu.toLocaleString()} VNĐ
        `);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity",0));

  // Label doanh thu trên cột
  svg.selectAll("text.label")
    .data(data)
    .enter()
    .append("text")
      .attr("x", d => x(d.DoanhThu) + 5)
      .attr("y", d => y(d.MatHang) + y.bandwidth()/2)
      .attr("dy", ".35em")
      .text(d => Math.round(d.DoanhThu/1e6) + " triệu VNĐ")
      .style("font-size","12px")
      .style("fill","#333");

  // Vẽ legend
  const legend = svg.append("g").attr("transform", `translate(${width+80},0)`);
  const groups = [...new Set(data.map(d => d.TenNhom))];
  groups.forEach((groupName, i) => {
    const ma = data.find(x => x.TenNhom === groupName).MaNhom;
    // Ô màu
    legend.append("rect")
      .attr("x",0).attr("y",i*25)
      .attr("width",18).attr("height",18)
      .attr("fill",color(ma));
    // Text
    legend.append("text")
    .attr("x",25)
    .attr("y",i*25+9)
    .attr("dy",".35em")
    .text(`[${ma}] ${groupName}`)
    .style("font-size","12px");
});
  });

