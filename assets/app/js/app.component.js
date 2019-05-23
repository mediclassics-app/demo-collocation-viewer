// https://www.chartjs.org/samples/latest/
var chartoptions = {
    // maintainAspectRatio:false,
    layout: {
        padding: {
            left: 50,
            right: 50,
            top: 20,
            bottom: 20
        }
    },
    scales: {
        yAxes: [{
            scaleLabel: {  // https://www.chartjs.org/docs/latest/axes/labelling.html
                display: true,
                labelString: 'T-Score'
            },
            ticks: {
                padding: 0,
            }
        }],
        xAxes: [{
            scaleLabel: {
                display: true,
                labelString: 'Simple Log Likelihood'
            },
            ticks: {
                padding: 0,
            }
        }],
    },
    title: {
        display: true,
        fontSize: 12,
        text: 'Custom Chart Title'
    },
    tooltips: {
        callbacks: {
          title: function(tooltipItems, data) {
              var idx = 0
              var tooltipItem = tooltipItems[idx];
              var label = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].label || '**';
              return label ;
           },
           // label: function(tooltipItem, data) {
           //     var label = data.datasets[tooltipItem.datasetIndex].label || '';
           //     if (label) { label += ': '; }
           //     label += "[x]"+tooltipItem.xLabel + ' €';
           //     return label ;
           // }
        }
    }
}



// var border_color_palette = ['#f87979', '#36a2eb', '#cc65fe', '#ffce56', '#92a8d1' ]
var border_color_palette = ['#92a8d1', '#034f84', '#f7cac9', '#f7786b', '#deeaee', '#b1cbbb', '#eea29a', '#c94c4c', '#6b5b95', '#feb236', '#d64161', '#ff7b25', '#a2b9bc', '#b2ad7f', '#878f99', '#6b5b95']
var background_color_palette = border_color_palette

Vue.component('scatter-chart', {
  extends: VueChartJs.Bubble,
  props: ["data", "options"],
  mounted() {
    this.renderBubbleChart();
  },
  computed: {
    datasets: function() {
        if( !this.data ){ return }
        console.log( this.data )
        var class_labels = this.data.class_labels
        return this.data.classificated_coor.map( function( v, i, arr ){
            return {
                'label': class_labels[i],
                'fill': false,
                'borderColor': border_color_palette[i],
                'backgroundColor': background_color_palette[i],
                'data': v,
            }
        })
      }
  },

  data: function() {
    return {
          // coordinate1: this.coordinate1,
          // title: 'component',
          open: false,
      }
  },

  methods: {
    renderBubbleChart: function() {
          this.renderChart({ datasets: this.datasets  }, this.options )
      }
    },
    watch: {
      data: function() {
        if ( this.$data._chart ){
          this.$data._chart.destroy();
        }
        this.renderBubbleChart();
      }
    }

});
