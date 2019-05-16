api_endpoint = "//localhost:5000/api"
// api_endpoint = "//localhost:5000/api"

var default_param = {
  "corpus": 'Treat',
  "model": 'DictSegmenter',
  "search_pattern": {
    'MAIN': "咳嗽|咳喘|喘咳",
    'AND': "痰|唾",
    'NOT': "上氣 咳逆"
  },
  "min_tf": 5,
  "collocation_method": 't_score',
  "top_n": 100,
  "half_window_size": 16,
  "ngram_range": [2,8]
}

function clone_obj( src ) {
    return JSON.parse(JSON.stringify( src ))
}

function split_str( str ){
    return (str + "").split(/[\s,]+/)
}

function clone_param( param ){
    var user_param = clone_obj( param )
    user_param.search_pattern.AND = split_str( param.search_pattern.AND )
    user_param.search_pattern.NOT = split_str( param.search_pattern.NOT )
    console.log( user_param)
    return user_param
}

function param2string( param ){
    return JSON.stringify( clone_param( param ) )
}

function floatFormat( num ){
    var q = 10 ** 3
    return Math.round( num * q)/ q
}

function toCoordinate( it ){
    // return {
      // 'x': floatFormat( Math.sqrt(it[2]) ),   // sqrt( observed_value )
      // 'y': floatFormat( it[4] ),              // t_score
      // 'r': floatFormat( Math.sqrt(it[3]) )*8  // expected_freq
    //   'label': it[0]
    // }
    return {
      'x': floatFormat( it[5]) ,                 // simple_ll
      'y': floatFormat( it[4] ),                 // t_score
      'r': floatFormat( Math.sqrt(it[2]) ) ,  // sqrt( observed_value )
      'label': it[0]
    }
}

var evtSource = false;

// https://www.chartjs.org/samples/latest/
var chartoptions = {
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
        open: false
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



var app = new Vue({
  el: '#app',
  // components: {
  //   ScatterChart
  // },
  data: {
    'param': default_param,
    'result': {},
    'status': {
        'ajx_loading': false,
        'sse_loading': false,
        'message': ""
    },
    'coordinate': [],
    'chartoptions': chartoptions,
    'tabfocus': 'plot'
  },
  computed: {
      data_class: function(){
          if(!this.result.data){ return }
          var dd = this.result.data
          var class_labels = dd.map( (it)=> it[7] ).filter( (v,i,a) => a.indexOf(v)==i )
          var classificated_data = class_labels.map( (c) => dd.filter( (v,i,a) => v[7] == c ) )
          var classificated_coor = classificated_data.map( (it) => it.map( toCoordinate ) )
          return {
              'class_labels': class_labels,
              'classificated_data': classificated_data,
              'classificated_coor': classificated_coor
          }
      }
  },
  updated: function () {
      if( this.result.data ){
          $('#dtTable').DataTable();
          $('.dataTables_length').addClass('bs-select');
      }
  },
  methods: {
      // update_component_data: function() {
      //   //console.log('updateComponentData', this.$refs)
      //     this.$refs.child1.open = true
      // },
      focusTab : function(tab_name){
          this.tabfocus = tab_name
      },

      ajx_doit: function() {

          console.log( "Method : ajx_doit" )
          this.ajx_reset();
          this.status.ajx_loading = true;
          // var ajxUrl = api_endpoint + "/collocation?query=" + param2string( this.param )
          // axios.get(ajxUrl)
          axios({
            method: 'post',
            url: api_endpoint + "/analysis/collocation",
            data: clone_param( this.param )
          })
          .then((response) => {
              console.log( response.data )
              this.result = response.data;
              this.coordinate = this.result.data.map( toCoordinate )
              this.status.ajx_loading = false;
              this.focusTab('plot')
          })
          .catch((ex)=> {
              console.log("ERR!!!!! : ", ex)
              this.status.ajx_loading = false;
          })

      },

      ajx_reset: function() {

          console.log( "Method : ajx_reset" )
          this.status.ajx_loading = false;
          this.status.message = ""
          this.result = {};

      },

      sse_doit: function() {
          console.log( "Method : doit" )

          this.sse_reset();
          var streamUrl = api_endpoint + "/stream?query=" + param2string( this.param )
          // Not a real URL, just using for demo purposes
          evtSource = new EventSource( streamUrl );
          this.status.sse_loading = true;

          var that = this;

          evtSource.addEventListener('header', e => {
            var header = JSON.parse(e.data);
            console.log( header )
          }, false);

          evtSource.addEventListener('message', e => {
            var message = JSON.parse(e.data);
            that.message = message;
            console.log( "message" )
            console.log( message )
          }, false);

          evtSource.addEventListener('close', e => {
            evtSource.close();
            this.status.sse_loading = false;
          }, false);

          evtSource.addEventListener('error', e => {
              if (e.readyState == EventSource.CLOSED) {
                  console.log('Event was closed');
                  console.log(EventSource);
              }
          }, false);

      },
      sse_reset: function() {
          console.log( "Method : reset" )
          if (evtSource !== false) {
            evtSource.close();
          }

          this.status.sse_loading = false;
          this.result = {};
          this.message = ""
      },


  }
})
