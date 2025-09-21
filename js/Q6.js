// Q6.js

// Kích thước và lề
const margin = { top: 40, right: 30, bottom: 50, left: 80 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Vùng vẽ
const svg = d3.select("#Q6")
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

// Parse datetime
const parseDateTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

d3.csv("ggdata.csv").then(raw => {
  raw.forEach(d => {
    d.Ngay = parseDateTime(d["Thời gian tạo đơn"]);
    d.DoanhThu = +d["Thành tiền"];
  });

  // B1: Gom theo Ngày + Giờ → tính tổng doanh thu của từng giờ trong ngày
  const tongTheoGioNgay = d3.rollups(
    raw,
    v => d3.sum(v, d => d.DoanhThu),
    d => d3.timeFormat("%Y-%m-%d")(d.Ngay),  // theo ngày
    d => d.Ngay.getHours()                   // theo giờ
  ).flatMap(([Ngay, arr]) =>
    arr.map(([Gio, Tong]) => ({
      Ngay: d3.timeParse("%Y-%m-%d")(Ngay),
      Gio,
      Tong
    }))
  );

  // B2: Gom tiếp theo Giờ → tính trung bình nhiều ngày
  const gioMap = d3.rollups(
    tongTheoGioNgay,
    v => ({
      Tong: d3.sum(v, d => d.Tong),
      Count: v.length
    }),
    d => d.Gio
  ).map(([Gio, obj]) => ({
    Gio,
    DoanhThuTB: obj.Tong / obj.Count
  }));

  gioMap.sort((a, b) => a.Gio - b.Gio);

  // Sinh nhãn khung giờ: 08:00–08:59
  gioMap.forEach(d => {
    d.Label = `${String(d.Gio).padStart(2, "0")}:00-${String(d.Gio).padStart(2, "0")}:59`;
  });

  // Scale X
  const x = d3.scaleBand()
              .domain(gioMap.map(d => d.Label))
              .range([0, width])
              .padding(0.2);

  // Scale Y bước nhảy 0.2M
  const step = 200000;
  const yMax = d3.max(gioMap, d => d.DoanhThuTB);
  const yDomain = Math.ceil(yMax / step) * step;

  const y = d3.scaleLinear()
              .domain([0, yDomain])
              .range([height, 0]);

  // Trục X
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

  // Trục Y
  svg.append("g")
    .call(d3.axisLeft(y)
            .tickValues(d3.range(0, yDomain + step, step))
            .tickFormat(d => (d/1e6).toFixed(1) + "M"));

  // Vẽ cột
  svg.selectAll(".bar")
    .data(gioMap)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.Label))
      .attr("y", d => y(d.DoanhThuTB))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.DoanhThuTB))
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
      .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1)
              .html(`<b>Khung giờ:</b> ${d.Label}<br>
                      <b>Doanh thu TB:</b> ${d3.format(",.2f")(d.DoanhThuTB)}`)
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


  // Label trên cột
  svg.selectAll(".label")
    .data(gioMap)
    .enter()
    .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.Label) + x.bandwidth()/2)
      .attr("y", d => y(d.DoanhThuTB) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => (d.DoanhThuTB/1e3).toFixed(1) + "K");
});
