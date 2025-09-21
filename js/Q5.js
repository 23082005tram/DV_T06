// Q5.js

// Kích thước và lề
const margin = { top: 20, right: 30, bottom: 60, left: 100 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Vùng vẽ
const svg = d3.select("#Q5")
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

  // Gom theo ngày trong tháng → tính trung bình
  const ngayMap = d3.rollups(
    doanhThuNgay,
    v => ({
      Tong: d3.sum(v, d => d.TongDoanhThu),
      Count: v.length
    }),
    d => d.Ngay.getDate()
  ).map(([Ngay, obj]) => ({
    Ngay,
    DoanhThuTB: obj.Tong / obj.Count
  }));

  ngayMap.sort((a, b) => a.Ngay - b.Ngay);

  const data = ngayMap;

  // Scale X
  const x = d3.scaleBand()
              .domain(data.map(d => d.Ngay))
              .range([0, width])
              .padding(0.2);

  // Scale Y (bước 5M)
  const yMax = d3.max(data, d => d.DoanhThuTB);
  const yDomain = Math.ceil(yMax / 5000000) * 5000000;

  const y = d3.scaleLinear()
              .domain([0, yDomain])
              .nice()
              .range([height, 0]);

  // Mỗi ngày 1 màu
  const color = d3.scaleOrdinal(d3.schemeTableau10)
                  .domain(data.map(d => d.Ngay));

  // Trục X (xoay nhãn 45°)
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => "Ngày " + d))
    .selectAll("text")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start");

  // Trục Y
  svg.append("g")
    .call(d3.axisLeft(y)
            .ticks(yDomain / 5000000)
            .tickFormat(d => (d/1e6) + "M"));

  // Vẽ cột
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
      .attr("x", d => x(d.Ngay))
      .attr("y", d => y(d.DoanhThuTB))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThuTB))
      .attr("fill", d => color(d.Ngay))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity",0.9);
        tooltip.html(`
          <strong>Ngày ${d.Ngay}</strong><br/>
          Doanh thu TB: ${d3.format(",")(d.DoanhThuTB)} VNĐ
        `);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity",0));

  /// Label xoay dọc ở đầu bar
  /// Label xoay dọc ở đầu bar
svg.selectAll("text.label")
  .data(data)
  .enter()
  .append("text")
    .attr("class","label")
    .attr("x", d => x(d.Ngay) + x.bandwidth()/2)
    .attr("y", d => {
      const barTopY = y(d.DoanhThuTB);
      const barHeight = height - barTopY;
      return barHeight >= 20 ? barTopY + 4 : barTopY - 4;
    })
    .attr("text-anchor","end")
    .attr("transform", d => {
      const xPos = x(d.Ngay) + x.bandwidth()/2;
      const yPos = y(d.DoanhThuTB);
      return `rotate(-90,${xPos},${yPos})`;  // xoay chữ từ trên xuống
    })
    .text(d => (d.DoanhThuTB/1e6).toFixed(1) + " Tr")
    .style("font-size","10px")
    .style("fill", d => {
      const barTopY = y(d.DoanhThuTB);
      const barHeight = height - barTopY;
      return barHeight >= 20 ? "white" : "black";
    });


});
