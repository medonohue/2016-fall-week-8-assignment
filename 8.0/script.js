console.log('8.3');

var m = {t:100,r:100,b:100,l:100};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//d3.set to hold a unique array of airlines
var airlines = d3.set();

//Scale
var scaleX = d3.scaleTime()
    .range([0,w]);//why doesn't it need a domain???
var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);
var scaleY = d3.scaleLinear()
    .domain([0,1000])
    .range([h,0]);

//Axis
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-h);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-w);



//Line generator
var lineGenerator = d3.line()
    .x(function(d){return scaleX(new Date(d.key) )})
    .y(function(d){return scaleY(d.averagePrice)})
    .curve(d3.curveCardinal);

d3.queue()
    .defer(d3.csv, '../data/bos-sfo-flight-fare.csv',parse)
    .await(function(err, data){

        //Mine the data to set the scales
        scaleX.domain( d3.extent(data,function(d){return d.travelDate}) );//sets domain for x scale - why here instead of above?? finds lowest and highest dates
        scaleColor.domain( airlines.values() );//what is airlines.values()?? it must come from airlines variable set above.

        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( airlines.values() )
            .enter()
            .append('a')
            .html(function(d){return d})
            .attr('href','#')
            .attr('class','btn btn-default')
            .style('color','white')
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
/*
            .on('click',function(d){
                //Hint: how do we filter flights for particular airlines?
                //data.filter(...)

                //How do we then update the dots?
            });
*/
            .on('click',function(d){
                //Hint: how do we filter flights for particular airlines?
                //data.filter(...)
				var dataFiltered = data.filter(function(e){return(d) == e.airline});
				
				draw(dataFiltered)
				
                //How do we then update the dots?
            });


        //Draw axis
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+h+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);
        
        //Append <path>; this should only happen once
        plot.append('path').attr('class','time-series');

        draw(data);

    });

function draw(rows){
    //IMPORTANT: data transformation
    
    rows.sort(function(a,b){return a.travelDate - b.travelDate});
    
    var flightsByTravelDate = d3.nest().key(function(d){return d.travelDate})
        .entries(rows);

    flightsByTravelDate.forEach(function(day){
       day.averagePrice = d3.mean(day.values, function(d){return d.price});
    });

    console.log(flightsByTravelDate);

    //Draw dots
    
    //UPDATE
    var node = plot.selectAll('.flight')
        .data(rows,function(d){return d.id});

    var nodeEnter = node.enter()
        .append('circle').attr('class','flight')
        .merge(node)
        .attr('r',3)
        .attr('cx',function(d){return scaleX(d.travelDate)})
        .attr('cy',function(d){return scaleY(d.price)})
        .style('fill',function(d){return scaleColor(d.airline)})
        .style('fill-opacity',.75) 
    
/*
    //UPDATE
    var node = plot.selectAll('.node')
        .data(rows,function(d){return d.price});
    //ENTER
    var nodeEnter = node.enter()
        .append('circle')
        .attr('class','node')
        .on('click',function(d,i){
            console.log(d);
            console.log(i);
            console.log(this);
        })
*/
        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.select('.title')
                .html(d.airline)
            tooltip.select('.value')
                .html('$' + d.price);

            tooltip.transition().style('opacity',1);

            d3.select(this).style('stroke-width','3px');
        })
        .on('mousemove',function(d){
            var tooltip = d3.select('.custom-tooltip');
            var xy = d3.mouse( d3.select('.container').node() );
            tooltip
                .style('left',xy[0]+40+'px')
                .style('top',xy[1]-135+'px');
        })
        .on('mouseleave',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.transition().style('opacity',0);

            d3.select(this).style('stroke-width','0px');
        });
    //UPDATE + ENTER
    nodeEnter
        .attr('cx',function(d){return scaleX(d.travelDate)})
        .attr('cy',function(d){return scaleY(d.price)})
        .merge(node)
        .attr('r',4)
        .transition()
        .attr('cx',function(d){return scaleX(d.travelDate)})
        .attr('cy',function(d){return scaleY(d.price)})
        .style('fill',function(d){return scaleColor(d.airline)});
    //EXIT
    node.exit().remove();


    //Draw path
    var pathLine = plot.select('.time-series')
        .datum(flightsByTravelDate)
        .transition()
        .attr('d',function(datum){
            return lineGenerator(datum);
        })
        .style('fill','none')
        .style('stroke-width','2px')
        .style('stroke',function(datum){
             return scaleColor(datum[0].values[0].airline);
        });

    //Draw <path>
}

function parse(d){

    if( !airlines.has(d.airline) ){
        airlines.add(d.airline);
    }

    return {
        airline: d.airline,
        price: +d.price,
        travelDate: new Date(d.travelDate),
        duration: +d.duration,
        id: d.id
    }
}

