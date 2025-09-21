// Q14.js - Line chart small multiples theo nhóm hàng (xác suất mặt hàng theo tháng)

const width = window.innerWidth,
      height = window.innerHeight,
      margin = { top: 50, right: 50, bottom: 50, left: 60 };

const cols = 3;       // số chart con mỗi hàng
const facetPaddingX = 60;
const facetPaddingY = 80;

// SVG
const svg = d3.select("#Q10")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("font-size", "13px")
  .style("border-radius", "6px")
  .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
  .style("pointer-events", "none")
  .style("opacity", 0);

const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

d3.csv("ggdata.csv").then(data => {
  // Chuẩn hóa dữ liệu
  data.forEach(d => {
    const date = parseTime(d["Thời gian tạo đơn"].trim());
    if (date) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      d.Thang = `${year}-${month}`; // YYYY-MM
    }
  });

  // Tổng số đơn theo (Thang, MaNhom)
  const groupMonthTotal = d3.rollup(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d.Thang,
    d => "[" + d["Mã nhóm hàng"] + "] " + d["Mã nhóm hàng"]
  );

  // Số đơn theo (Thang, MaNhom, MaMH)
  const groupMonthItem = d3.rollup(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d.Thang,
    d => "[" + d["Mã nhóm hàng"] + "] " + d["Mã nhóm hàng"],
    d => "[" + d["Mã mặt hàng"] + "] " + d["Mã mặt hàng"]
  );

  // Dataset chuẩn hóa
  const dataset = [];
  groupMonthItem.forEach((nhomMap, thang) => {
    nhomMap.forEach((itemMap, maNhom) => {
      const total = groupMonthTotal.get(thang).get(maNhom);
      itemMap.forEach((count, maMH) => {
        const sample = data.find(d => "[" + d["Mã nhóm hàng"] + "] " + d["Mã nhóm hàng"] === maNhom 
                                     && "[" + d["Mã mặt hàng"] + "] " + d["Mã mặt hàng"] === maMH);
        dataset.push({
          Thang: thang,
          MaNhom: maNhom,
          TenNhom: sample?.["Tên nhóm hàng"],
          MaMH: maMH,
          TenMH: sample?.["Tên mặt hàng"],
          XacSuat: count / total
        });
      });
    });
  });

  // Gom theo nhóm hàng
  const groups = d3.groups(dataset, d => d.MaNhom);

  // Layout
  const rows = Math.ceil(groups.length / cols);
  const facetW = (width - margin.left - margin.right - (cols - 1) * facetPaddingX) / cols;
  const facetH = (height - margin.top - margin.bottom - (rows - 1) * facetPaddingY) / rows;

  groups.forEach(([maNhom, values], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const gx = margin.left + col * (facetW + facetPaddingX);
    const gy = margin.top + row * (facetH + facetPaddingY);

    const g = svg.append("g").attr("transform", `translate(${gx},${gy})`);

    // scale X
    const xDomain = [...new Set(values.map(d => d.Thang))].sort();
    const x = d3.scalePoint()
      .domain(xDomain)
      .range([0, facetW - 80])
      .padding(0.5);

    // scale Y từ 0, step 0.2
    const maxY = Math.ceil(d3.max(values, d => d.XacSuat) * 5) / 5;
    const y = d3.scaleLinear()
      .domain([0, maxY])
      .range([facetH - 60, 0]);

    const yAxis = d3.axisLeft(y)
      .tickValues(d3.range(0, maxY + 0.01, 0.2))
      .tickFormat(d3.format(".0%"));

    g.append("g").call(yAxis);

    // trục X
    g.append("g")
      .attr("transform", `translate(0,${facetH - 60})`)
      .call(
        d3.axisBottom(x)
          .tickValues(xDomain)
          .tickFormat(d => `T${d.split("-")[1]}`)
      )
      .selectAll("text")
      .attr("text-anchor", "middle");

    // line chart theo mặt hàng
    const items = d3.groups(values, d => d.MaMH);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(items.map(d => d[0]));

    const line = d3.line()
      .x(d => x(d.Thang))
      .y(d => y(d.XacSuat));

    items.forEach(([maMH, arr]) => {
      arr.sort((a, b) => d3.ascending(a.Thang, b.Thang));

      // path line
      g.append("path")
        .datum(arr)
        .attr("fill", "none")
        .attr("stroke", color(maMH))
        .attr("stroke-width", 2)
        .attr("d", line);

      // invisible path hover
      g.append("path")
        .datum(arr)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 10)
        .attr("d", line)
        .style("cursor", "pointer")
        .on("mouseover", () => tooltip.transition().duration(200).style("opacity", 1))
        .on("mousemove", (event) => {
          const [mx] = d3.pointer(event);
          const x0 = xDomain.reduce((a, b) => Math.abs(x(b) - mx) < Math.abs(x(a) - mx) ? b : a);
          const pt = arr.find(d => d.Thang === x0);
          if (pt) {
            const monthLabel = `T${pt.Thang.split("-")[1]}`;
            tooltip.html(
              `Tháng: ${monthLabel}<br/>Mặt hàng: ${pt.MaMH} ${pt.TenMH}<br/>Xác suất: ${(pt.XacSuat*100).toFixed(1)}%`
            )
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
          }
        })
        .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

      // chấm nhỏ trên điểm
      g.selectAll(".dot-" + maMH)
        .data(arr)
        .join("circle")
        .attr("cx", d => x(d.Thang))
        .attr("cy", d => y(d.XacSuat))
        .attr("r", 4)
        .attr("fill", color(maMH))
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          const monthLabel = `T${d.Thang.split("-")[1]}`;
          tooltip.html(
            `Tháng: ${monthLabel}<br/>Mặt hàng: ${d.MaMH} ${d.TenMH}<br/>Xác suất: ${(d.XacSuat*100).toFixed(1)}%`
          );
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 12) + "px")
                 .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));
    });

    // tiêu đề nhóm
    g.append("text")
      .attr("x", (facetW - 80) / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .text(`${maNhom} ${values[0].TenNhom}`);
  });
});
