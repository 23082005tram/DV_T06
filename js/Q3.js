// Kích thước và lề
const margin = { top: 20, right: 30, bottom: 50, left: 80 },
      width = 1000 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Vùng vẽ
const svg = d3.select("#Q3")
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

// Đọc dữ liệu
d3.csv("ggdata.csv").then(raw => {
  const parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

  raw.forEach(d => {
    d.Ngay = parseDateTime(d["Thời gian tạo đơn"]);
    d.DoanhThu = +d["Thành tiền"];
  });

  // Gom doanh thu theo tháng
  const data = d3.rollups(
    raw,
    v => d3.sum(v, d => d.DoanhThu),
    d => d3.timeMonth(d.Ngay)
  ).map(([Thang, DoanhThu]) => ({ Thang, DoanhThu }));

  data.sort((a, b) => d3.ascending(a.Thang, b.Thang));

  // Scale
  const x = d3.scaleBand()
              .domain(data.map(d => d3.timeFormat("Tháng %m")(d.Thang)))
              .range([0, width])
              .padding(0.05);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.DoanhThu)])
              .nice()
              .range([height, 0]);

  // Mỗi tháng 1 màu
  const color = d3.scaleOrdinal(d3.schemeTableau10)
                  .domain(data.map(d => d3.timeFormat("%m")(d.Thang)));

  // Trục
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(
      d3.axisLeft(y)
        .tickValues(d3.range(0, d3.max(data, d => d.DoanhThu) + 1e8, 1e8))
        .tickFormat(d => d/1e6 + "M")
    );

  // Vẽ cột với tooltip
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
      .attr("x", d => x(d3.timeFormat("Tháng %m")(d.Thang)))
      .attr("y", d => y(d.DoanhThu))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThu))
      .attr("fill", d => color(d3.timeFormat("Tháng %m")(d.Thang)))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity",0.9);
        tooltip.html(`
          <strong>Tháng:</strong> ${d3.timeFormat("Tháng %m")(d.Thang)}<br/>
          <strong>Doanh số:</strong> ${d.DoanhThu.toLocaleString()} VNĐ
        `);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity",0));

  // Label nằm trong bar hoặc ngoài bar nếu ngắn
  svg.selectAll("text.label")
    .data(data)
    .enter()
    .append("text")
      .attr("x", d => {
        const barWidth = x.bandwidth();
        return barWidth > 30 ? x(d3.timeFormat("Tháng %m")(d.Thang)) + barWidth/2 : x(d3.timeFormat("Tháng %m")(d.Thang)) + barWidth + 5;
      })
      .attr("y", d => {
        const barHeight = height - y(d.DoanhThu);
        return barHeight > 20 ? y(d.DoanhThu) + 20 : y(d.DoanhThu) - 5;
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text(d => Math.round(d.DoanhThu/1e6) + " triệu")
      .style("font-size","12px")
      .style("fill", d => (height - y(d.DoanhThu) > 20 ? "#fff" : "#333"));
});
