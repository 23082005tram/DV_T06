// Kích thước và lề
const margin = { top: 20, right: 30, bottom: 40, left: 200 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Vùng vẽ
const svg = d3.select("#Q2")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
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

d3.csv("ggdata.csv").then(raw => {
  // B1: Gom nhóm theo Nhóm hàng
  const data = d3.rollups(
    raw,
    v => ({
      DoanhThu: d3.sum(v, d => +d["Thành tiền"]),
      MaNhom: v[0]["Mã nhóm hàng"]
    }),
    d => "[" + d["Mã nhóm hàng"] + "] " + d["Tên nhóm hàng"]
  ).map(([TenNhom, info]) => ({ TenNhom, ...info }));

  // Sắp xếp giảm dần
  data.sort((a, b) => d3.descending(a.DoanhThu, b.DoanhThu));

  // B2: Scale
  const y = d3.scaleBand()
              .domain(data.map(d => d.TenNhom))
              .range([0, height])
              .padding(0.1);

  const x = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.DoanhThu)])
              .nice()
              .range([0, width]);

  // Mỗi nhóm hàng một màu
  const color = d3.scaleOrdinal(d3.schemeTableau10)
                  .domain(data.map(d => d.TenNhom));

  // B3: Trục Y (Tên nhóm hàng)
  svg.append("g").call(d3.axisLeft(y));

  // B4: Trục X (doanh thu, tick cách nhau 100M)
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickValues(d3.range(0, d3.max(data, d => d.DoanhThu) + 5e8, 5e8))
        .tickFormat(d => d/1e6 + "M")
    );

  // B5: Vẽ cột ngang với tooltip
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
      .attr("y", d => y(d.TenNhom))
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.DoanhThu))
      .attr("fill", d => color(d.TenNhom))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity",0.9);
        tooltip.html(`
          <strong>Nhóm hàng:</strong> ${d.TenNhom}<br/>
          <strong>Doanh số bán:</strong> ${d.DoanhThu.toLocaleString()} VNĐ
        `);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity",0));

  // B6: Label nằm trong bar, tự điều chỉnh màu và vị trí
  svg.selectAll("text.label")
    .data(data)
    .enter()
    .append("text")
      .attr("x", d => {
        const barWidth = x(d.DoanhThu);
        return barWidth > 50 ? barWidth - 5 : barWidth + 5;  // nếu bar ngắn, label ra ngoài
      })
      .attr("y", d => y(d.TenNhom) + y.bandwidth()/2)
      .attr("dy", ".35em")
      .attr("text-anchor", d => x(d.DoanhThu) > 50 ? "end" : "start") // căn phải/ trái
      .text(d => Math.round(d.DoanhThu/1e6) + " triệu VNĐ")
      .style("font-size","12px")
      .style("fill", d => x(d.DoanhThu) > 50 ? "#fff" : "#333"); // trắng trong bar, đen ngoài bar
});
