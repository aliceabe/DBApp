$(function () {
    $('#container1').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 1,
            plotShadow: false
        },
        title: {
            text: local_title
        },
        xAxis: {
            categories: ['Carrier', 'Late Aircraft', 'NAS', 'Security', 'Weather']
        },
        tooltip: {
            pointFormat: '{point.name}: <b>{point.y:.1f}</b>'
        },
        plotOptions: {
            column: {
                    pointPadding: 0,
                    borderWidth: 0,
                    groupPadding: 0.1,
                    shadow: false
                }
            
        },
        series: [{
            type: 'column',
            data: local_data
        }]
    });
});

$(function () {
    $('#container2').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 1,
            plotShadow: false
        },
        title: {
            text: local_title
        },
        xAxis: {
            categories: ['Carrier', 'NAS', 'Security', 'Weather']
        },
        tooltip: {
            pointFormat: '{point.name}: <b>{point.y:.1f} mins</b>'
        },
        plotOptions: {
            column: {
                    pointPadding: 0,
                    borderWidth: 0,
                    groupPadding: 0.1,
                    shadow: false
                }
            
        },
        series: [{
            type: 'column',
            data: local_data_cancel
        }]
    });
});
