"use strict";

// const BASE_URL = "https://health.data.ny.gov/resource/xdss-u53e.json";

// const $locations = $(".location");

/* Function makes a get request to API */

async function countyData(county_name) {
  const response = await axios({
    url: "https://health.data.ny.gov/resource/xdss-u53e.json",
    params: {
      county: county_name
    },
    method: "GET"
  });
  return response.data
}

/* Handles a form submission. */

function createChart(data) {
  // const $chart = $('<div class="bar-chart">');
  // const $svg = $(``);
  // const $container = $('#container');
  // console.log($svg);
  const county = data[0].county.split(' ').join('').split('.').join('');
  // $svg
  //   .attr("height", "600")
  //   .attr("width", "1000")
  //   .attr('id', county)
  //   .addClass("p-10");
  // $chart.append($svg);
  // $container.append($chart);


  const margin = 60;
  const width = 1000 - 2 * margin;
  const height = 600 - 2 * margin;
  const svg = d3.select(`#${county}`);
  console.log(svg);
  const chart = svg.append('g')
    .attr('transform', `translate(${margin}, ${margin})`);
  console.log('data is', data);
  const newPostitives = data.map(s => s.new_positives);
  const maxPos = Math.max(...newPostitives);
  console.log('max is', maxPos);
  const yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, maxPos]);
  chart.append('g')
    .call(d3.axisLeft(yScale));

  const xScale = d3.scaleTime()
    .range([0, width])
    .domain(d3.extent(data.map((s) => Date.parse(s.test_date))))

  chart.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%b %Y')))

  const barGroups = chart.selectAll()
    .data(data)
    .enter()
    .append('g')

  barGroups
    .append('rect')
    .style("fill", "blue")
    .style("opacity", 0.5)
    // .style("pointer-events","all")
    .attr("x", (s) => xScale(Date.parse(s.test_date)))
    .attr("y", (s) => yScale(s.new_positives))
    .attr('height', (s) => height - yScale(s.new_positives))
    .attr('width', width / data.length)
    .on('mouseover', function (evt, d) {
      const date = new Date(d.test_date);
      d3.select(this)
      // .transition()
      // .duration(200)
        .style('opacity', 1)
      d3.select('#cases').text(`Daily New Cases: ${d.new_positives}`);
      d3.select('#date').text(`Date: ${date.toDateString()}`);
      d3.select('#tooltip')
        .style('opacity', 0.8)
        .style("display", "block")
        .style("left", (evt.pageX - 10) + "px")
        .style("top", (evt.pageY - 100) + "px");    
      })
    .on('mouseout', function() {
      d3.select(this)
      .style('opacity', 0.5)
    })

  // chart.selectAll("bar")
  //   .data(data)
  //   .enter().append("rect")
  //   .style("fill", "blue")
  //   .style("opacity", 0.5)
  //   .style("pointer-events","all")
  //   .attr("x", (s) => xScale(Date.parse(s.test_date)))
  //   .attr("y", (s) => yScale(s.new_positives))
  //   .attr('height', (s) => height - yScale(s.new_positives))
  //   .attr('width', width / data.length)
  //   .on('mouseenter', function (actual, i) {
  //     console.log('MOUSE', this)
  //     d3.select(this)
  //     .transition()
  //     .duration(200)
  //       .style('opacity', 1)
  //     d3.select('#cases').text(`${d.new_positives}`)

    // });


  addLabels(svg, height, margin, width, data)


  // $("body").html($("body").html());
}

function addLabels(svg, height, margin, width, data) {
  svg.append('text')
    .attr('x', -(height / 2) - margin)
    .attr('y', margin / 2.4)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text('New Positive Cases');

  svg.append('text')
    .attr('x', width / 2 + margin)
    .attr('y', (margin))
    .attr('text-anchor', 'middle')
    .text(`${data[0].county}`)
}







// let data = [];

/* On starting page, add event listener on like buttons */

async function start() {
  const $locations = $(".location");
  console.log('LOCATIONS ARE', $locations);
  console.log($locations);
  for (let loc of $locations) {
    let data = [];
    // let loc = $locations[0]
    let $loc = $(loc);
    let location = $loc.text()
    console.log('location', location)
    data = await countyData(location);
    createChart(data);
  }
}

$(start);