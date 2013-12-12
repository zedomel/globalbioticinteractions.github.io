var tree = d3.layout.tree().size( [ 700, 1280 ]);

var diagonal = d3.svg.diagonal()
    .projection( function( d ) { return [ d.y, d.x ]; } );

jQuery( function() {

    var rawData, root, nodeId = 0;
    var drawingArea = d3.select( '#tree_container' ).append( 'svg:svg' )
                .attr( 'width', 1280 )
                .attr( 'height', 700 )
            .append( 'svg:g' )
                .attr( 'transform', 'translate(60, 0)' );

    var source, sourcePath, sourcePathLength,
        structureObject = { name: 'tree of life', children: [] }, structureStepper = {},
        stepperStart = {},
        j, l, part, stepFound, stepIndex, temp;

    d3.json( 'interaction.json', function( json ) {

        rawData = json;

// Parse JSON data into tree compatible structure (Start)
        structureStepper = structureObject.children;
        stepperStart = structureObject.children;

        for ( var i = 0, rawDatum; rawDatum = rawData[ i ]; i++ ) {

            for ( var fieldIndex = 0, fields = [ 'source', 'target' ]; fieldIndex < fields.length; fieldIndex++ ) {
                source = rawDatum[ fields[ fieldIndex ] ];

                if ( source[ 'id' ] !== 'no:match' ) {
                    sourcePath = source[ 'path' ].split( ' | ' );
                    sourcePathLength = sourcePath.length;

                    for ( j = 0; j < sourcePathLength; j++ ) {
                        part = sourcePath[ j ];

                        stepFound = false;
                        for ( l = 0; l < structureStepper.length; l++ ) {
                            if ( structureStepper[ l ][ 'name' ] === part ) {
                                stepFound = true;
                                stepIndex = l;
                                break;
                            }
                        }

                        if ( !stepFound ) {
                            temp = { name: part, children: [] };
                            if ( j == ( sourcePathLength - 1 ) ) {
                                temp.eol_id = source[ 'id' ];
                            }

                            structureStepper.push( temp );
                            structureStepper = temp.children;
                        }
                        else {
                            structureStepper = structureStepper[ stepIndex ][ 'children' ];
                        }
                    }

                    structureStepper = stepperStart;
                }

            }

        }

// Parse JSON data into tree compatible structure (End)

        root = structureObject;
        root.x0 = 350;
        root.y0 = 0;

        function toggleAll( d ) {
            if ( d.children ) {
                d.children.forEach( toggleAll );
                toggle( d );
            }
        }

        //root.children.forEach( toggleAll );

        update( root );
    } );

    function update( source ) {
        var duration = 500;

        var nodes = tree.nodes( root ).reverse();

        nodes.forEach( function( d ) {
            d.y = d.depth * 150;
            // Remove children property for leafes
            if ( d._children && d._children.length === 0 ) {
                delete d._children;
                delete d.children;
            }
        } );

        var node = drawingArea.selectAll( 'g.node' )
                    .data( nodes, function( d ) { return d.id || ( d.id = ++nodeId ); } );

        var newNode = node.enter().append( 'svg:g' )
                        .attr( 'class', 'node' )
                        .attr( 'id', function( d ) { return d.id; } )
                        .attr( 'data-eol-id', function( d ) { return d.eol_id } )
                        .attr( 'transform', function( d ) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; } )
                        .on( 'click', function( d ) { toggle( d ); update( d ) } );

        newNode.append( 'svg:circle' )
                .attr( 'r', 1e-6 )
                .style( 'fill', function( d ) { return d._children ? 'darkseagreen' : '#fff' } );

        newNode.append( 'svg:text' )
            .attr( 'x', function( d ) { return d.children || d._children ? -10 : 10; } )
            .attr( 'dy', '.35em' )
            .attr( 'text-anchor', function( d ) { return d.children || d._children ? 'end' : 'start'; } )
            .attr( 'font-family', 'Helvetica, "Helvetica Neue", Arial, sans-serif')
            .text( function( d ) { return d.name; } )
            .style( 'fill-opacity', 1e-6 );

        var updateNode = node.transition()
                            .duration( duration )
                            .attr( 'transform', function( d ) { return 'translate(' + d.y + ',' + d.x + ')'; } );

        updateNode.select( 'circle' )
            .attr( 'r', 4.5 )
            .style( 'fill', function( d ) { return d._children ? 'darkseagreen' : '#fff'; } );

        updateNode.select( 'text' )
            .style( 'fill-opacity', 1 );

        var exitNode = node.exit().transition()
                        .duration( duration)
                        .attr( 'transform', function( d ) { return 'translate(' + source.y + ',' + source.x + ')' } )
                        .remove();

        exitNode.select( 'circle' )
                    .attr( 'r', 1e-6 );

        exitNode.select( 'text' )
            .style( 'fill-opacity', 1e-6 );

        var intraLink = drawingArea.selectAll( 'path.link' )
                    .data( tree.links( nodes ), function( d ) { return d.target.id; } );

        intraLink.enter().insert( 'svg:path', 'g' )
            .attr( 'class', 'link' )
            .attr( 'd', function( d ) {
                var o = { x: source.x0, y: source.y0 };
                return diagonal( { source: o, target: o } );
            } )
            .transition()
                .duration( duration )
                .attr( 'd', diagonal );

        intraLink.transition()
            .duration( duration )
            .attr( 'd', diagonal );

        intraLink.exit().transition()
            .duration( duration )
            .attr( 'd', function( d ) {
                var o = { x: source.x, y: source.y };
                return diagonal( { source: o, target: o } );
            } )
            .remove();

        nodes.forEach( function( d ) {
            d.x0 = d.x;
            d.y0 = d.y;
        } );
    }

    function toggle( d ) {
        if ( d.children ) {
            d._children = d.children;
            d.children = null;
        }
        else {
            d.children = d._children;
            d._children = null;
        }
    }
} );