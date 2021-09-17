'use strict'
window.addEventListener('DOMContentLoaded', function(event) {
    //#region Add some initial settings and variables for the chart

    let svgWidth = window.innerWidth,
        svgHeight = window.innerHeight / 1.33,
        margin = { top: 100, right: 250, bottom: 80, left: 100 },
        chartWidth = svgWidth - margin.left - margin.right,
        chartHeight = svgHeight - margin.top - margin.bottom;
        
    const color = d3.scaleOrdinal(["#d0743c", "#ff8c00", '#80a8e5', '#9cbceb']);    
    const pieColor = d3.scaleOrdinal([ '#9cbceb', '#ff8c00']);
    const pieRadius = 60;
    let pieData = [];

    const pieWidth = margin.right;
    const pieHeight = 250;
    
    let data,
        currentMonth,
        groupKey,
        keys,
        yScale,
        xScale1,
        xScale0;
    //#endregion Initial settings and variables

    //#region Data interpolation
        let calculateMonth = (m) => {
            currentMonth = exchangeRate.map(e => e.month)[m]
            data = exchangeRate.filter( d => d.month === currentMonth).map(e => e.days)[0];
            return data
        }

        calculateMonth(0);
    //#endregion Data interpolation

    //#region Create SVG container for the chart
    let svg = d3.select('#chartWrap')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('class', 'chart-container');

    let mainContainer = svg.append('g')
        .attr('class', 'chart')
        .attr("transform", `translate(${margin.left} ,${margin.top})`);

    // Create chart Scales
    yScale = d3.scaleLinear()
        .domain([0, d3.max(data.map(e => parseFloat((1/e.sellGBP).toFixed(2))))])
        .rangeRound([ chartHeight, 0]);
        
    groupKey = Object.keys(data[0])[0];
    keys = Object.keys(data[0]).slice(1);

    xScale0 = d3.scaleBand()
        .domain(data.map(d => d = +d[groupKey].split('/')[1]))
        .rangeRound([0, chartWidth])
        .padding(0.1);

    xScale1 = d3.scaleBand()
        .domain(keys)
        .rangeRound([0, xScale0.bandwidth()])
        .padding(0.05)
        
    //#endregion Create SVG container for the chart
    
    //#region Add chart Title
    const title = mainContainer.append('text')
        .attr('x', `${(svgWidth - margin.left - margin.right) / 2}`)
        .attr('text-anchor', 'middle')
        .attr('y', -40)
        .text('Buy / Sell rate for one Euro')
        .attr('class', 'chart-title');

    //#endregion Add chart Title

    //#region Add chart axes

    // Add X axis - days of the month + Month name
    const xAxis = d3.scaleBand()
        .domain( data.map(e => e = +(e.date).split('/')[1]))
        .range([0, chartWidth])
        .padding([0.15]);
        mainContainer.append("g")
            .attr('class', 'axis axis-x')
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(xAxis).tickSizeOuter(0))
            .append('text')
                .attr('class', 'x-axis-month')
                .attr('x', 40)
                .attr('y', 50)
                .text(`${currentMonth}`);
    
    // Add Y axis for GBP rate
    const yAxisGBP = d3.scaleLinear()
        .domain([0, d3.max(data.map(e => parseFloat((1/e.sellGBP).toFixed(2))))])
        .range([ chartHeight, 0 ]);
        mainContainer.append("g")
            .attr('class', 'axis axis-y axis-gbp')
            .attr("transform", `translate(0, 0)`)
            .call(d3.axisLeft(yAxisGBP).tickSizeOuter(0))
            .call(g => g.select(".domain").remove())
            .append('text')
                .attr('class', 'y-axis-rate')
                .style("text-anchor", "middle")
                .attr('x', -20)
                .attr('y', -10)            
                .text('GBP');

    // Add Y axis for USD rate
    const yAxisUSD = d3.scaleLinear()
        .domain([0, d3.max(data.map(e => parseFloat((1/e.sellGBP).toFixed(2))))])
        .range([ chartHeight, 0 ]);
        mainContainer.append("g")
            .attr('class', 'axis axis-y axis-usd')
            .attr("transform", `translate(-50, 0)`)
            .call(d3.axisLeft(yAxisUSD).tickSize(0))
            .call(g => g.select(".domain").remove())
            .append('text')
                .attr('class', 'y-axis-rate')
                .style("text-anchor", "middle")
                .attr('x', -10)
                .attr('y', -10)
                .text('USD');

    // Removing some of the visual component on the X Axes to match the primer
    mainContainer.selectAll('.axis-gbp .tick')
        .selectAll('line')
        .attr('x2', chartWidth)
        .attr('stroke', '#aaa');
        
    //#endregion Add chart axes
    
    //#region Add rate bars
    const update = (data) => {
        let group = mainContainer.append("g")
            .attr('class', 'bars')
            
        let ratesGroup = group.selectAll("g.barGroup")
            .data(data)
            .join("g")
                .attr('class', 'barGroup')
                .attr("transform", d => `translate(${xScale0(parseInt(d[groupKey].split('/')[1]))},0)`)

        ratesGroup.on('mouseover', function(d, i){            
            let dailyRates = Object.values(i).slice(1);
            let buyUSD = parseFloat((1/dailyRates[0]).toFixed(2));
            let sellUSD = parseFloat((1/dailyRates[1]).toFixed(2));
            let buyGBP = parseFloat((1/dailyRates[2]).toFixed(2));
            let sellGBP = parseFloat((1/dailyRates[3]).toFixed(2));
            pieData = [[buyGBP, buyUSD],[sellGBP, sellUSD]];
            addPie(pieData);
        })
        .on('mouseout', function(d, i){
            d3.selectAll('.pie-svg').remove();
        });

        let bars = ratesGroup.selectAll("rect")
        .data(d => keys.map(key => ({key, value: 1 / d[key]})))
        .join("rect")
            .attr("x", d => xScale1(d.key))
            .attr("y", chartHeight)
            .attr("width", xScale1.bandwidth())
            .attr("height", 0)
            .attr("fill", d => color(d.key))

        // Add some transition on initial bars loading
        bars.transition()
            .duration(1050)
            .delay((d, i) => 250 + i * 20)
            .attr("height", d => yScale(0) - yScale(d.value))
            .attr("y", d => yScale(d.value))            
    }
    update(data);
    //#endregion Add rate bars

    //#region Add Pie chart for the different rates

    function addPie(d) {        
        const pieContainer = svg.append('svg')
            .attr('width', pieWidth)
            .attr('height', svgHeight)
            .attr('x', `${svgWidth - margin.right}`)
            .attr('y', margin.top)
            .attr('class', 'pie-svg')

        const pie = d3.pie().value((d, i) => d[i])
        const arc = d3.arc().outerRadius(pieRadius).innerRadius(0)

        let pieRate = pieContainer.selectAll("svg")
            .data((d, i) => pieData[i])
            .enter().append("svg")
            .attr('width', pieWidth)
            .attr('height', pieHeight)
            .attr('y', (d, i) => `${i * 200}`)
            .append("g")
                .attr("transform", `translate(${pieWidth / 2}, 110)`);
            
        pieRate.selectAll("path")
            .data(pie(pieData))
            .enter().append("path")
            .attr("d", arc)
            .style('fill', (d, i) => pieColor(i))
            .style('stroke', '#f5f5f5')
            .style('stroke-width', 2);

        let text = ['Buy', 'Sale'];

        pieRate.append('text')
            .text((d, i) => text[i])
            .attr('y', -70)
            .attr('x', `0`)
            .attr('text-anchor', 'middle')
            .attr('class', 'pie-title');

        // Add Pie chart labels
        let labels = pieContainer.append('g')
            .attr('class', 'labels')
            .attr("transform", `translate(-15, ${pieHeight*0.75})`);

        labels.append('g').selectAll('text')
            .data([1, 2])
            .enter().append('text')
            .text(d => d)
            .attr('y', 0)
            .attr('x', (d, i) => i * 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#222')
            .attr('font-size', '1.125rem')
            .attr('font-family', 'Arial, sans-serif')
            .attr('class', 'pie-labels')
            .attr("transform", `translate(${pieWidth / 2}, ${pieHeight})`);
            
        labels.append('g').selectAll('rect')
            .data([1, 2])
            .enter().append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('y', -11)
            .attr('x', (d, i) => i * 40 )
            .attr('fill', (d, i) => pieColor(i))
            .attr("transform", `translate(${(pieWidth / 2) - 20}, ${pieHeight})`);
    }

    //#endregion Add Pie chart for the different rates
                
    // #region Add chart update controls
    const buttons = d3.select('#chartWrap').append('div')
        .attr('class', 'chart-btn-wrap');        
    
    const prevButtons = buttons.append('a')
        .attr('href', `javascript:void(0)`)
        .attr('id', 'prev-month')
        .attr('title', 'Change to previous month')
        .text('< prev month')
        
    const nextButtons = buttons.append('a')
        .attr('href', `javascript:void(0)`)
        .attr('id', 'next-month')
        .attr('title', 'Change to next month')
        .text('next month >')

    const nextMonthBtn = document.querySelector('#next-month');
    const prevMonthBtn = document.querySelector('#prev-month');

    prevMonthBtn.onclick = function(e) {
        calculateMonth(0);
        update(data)
    }
    nextMonthBtn.onclick = function(e) {
        calculateMonth(1);
        update(data)
    }
    // #endregion Add chart update controls
});