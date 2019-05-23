function get_param( idx ){

    var default_param0 = {
      "corpus": 'Treat',
      "model": 'DictSegmenter',
      "search_pattern": {
        'MAIN': "",
        'AND': "",
        'NOT': ""
      },
      "min_tf": 5,
      "collocation_method": 't_score',
          "top_n": 100,
          "half_window_size": 16,
          "ngram_range": [2,8]
        }

    var default_param1 = {
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

    var default_param2 = {
      "corpus": 'Treat',
      "model": 'ScoreSegmenter',
      "search_pattern": {
        'MAIN': "當歸",
        'AND': "川芎|芎藭 地黃",
        'NOT': ""
      },
      "min_tf": 5,
      "collocation_method": 't_score',
      "top_n": 100,
      "half_window_size": 16,
      "ngram_range": [2,8]
    }

    var default_param3 = {
      "corpus": 'Raw',
      "model": 'NgramTokenizer',
      "search_pattern": {
        'MAIN': "瘀血|血瘀|蓄血|血蓄",
        'AND': "",
        'NOT': ""
      },
      "min_tf": 5,
      "collocation_method": 't_score',
      "top_n": 100,
      "half_window_size": 16,
      "ngram_range": [2,8]
    }

    return [default_param0, default_param1, default_param2, default_param3][idx]

}

function clone_param( param ){
    var user_param = clone_obj( param )
    user_param.search_pattern.AND = split_str( param.search_pattern.AND )
    user_param.search_pattern.NOT = split_str( param.search_pattern.NOT )
    console.log( user_param)
    return user_param
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

var app = new Vue({
  el: '#analyzer',
  // components: {
  //   ScatterChart
  // },
  data: {
    'default_param_idx': 1,
    'param': get_param(1),
    'result': {},
    'status': {
        'ajx_loading': false,
        'sse_loading': false,
        'message': ""
    },
    // 'coordinate': [],
    'chartoptions': chartoptions,
    'chart': {
        height: 80,
        width: 80
    },
    'tabfocus': 'plot'
  },
  computed: {
      chartstyle: function(){
          return {
              'width': this.chart.width.toString() + '%',
              'height': this.chart.height.toString() + '%',
              'display': 'block',
              'margin-left': 'auto',
              'margin-right': 'auto'
          }
      },
      param_sanitized: function( k ){
          return clone_param(this.param)
      },
      param_str: function(){
          return JSON.stringify( this.param_sanitized, undefined, 4)
      },
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
      apply_chart_style: function( type, value ){
          this.chart[ type ] += value
          console.log( this.chart )
      },
      apply_param: function( idx ){
          this.default_param_idx = idx
          this.param = get_param( this.default_param_idx )
      },

      focusTab : function(tab_name){
          this.tabfocus = tab_name
      },

      ajx_doit: function() {

          console.log( "Method : ajx_doit" )
          this.status.ajx_loading = true;
          // var ajxUrl = api_endpoint + "/collocation?query=" + param2string( this.param )
          // axios.get(ajxUrl)
          axios({
            timeout: 20000,
            method: 'post',
            url: api_endpoint + "/api/analysis/collocation",
            data: this.param_sanitized
          })
          .then((response) => {
              console.log( response.data )
              this.status.ajx_loading = false;
              if( response.data.STATUS != "fail"  ){

                if ( response.data.RESULT === undefined || response.data.RESULT.length == 0) {
                    alert( response.data.MESSAGE );
                } else {
                    this.result = response.data.RESULT;
                    // this.coordinate = this.result.data.map( toCoordinate )
                    this.focusTab('plot')
                }
              } else {
                  alert( "There is no result" );
              }

          })
          .catch((ex)=> {
              this.status.ajx_loading = false;
              alert( "Server does not response" );
              console.log("ERR!!!!! : ", ex)
          })

      },

      ajx_reset: function() {

          console.log( "Method : ajx_reset" )
          this.status.ajx_loading = false;
          this.status.message = ""
          this.result = {};
          this.apply_param(0)

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
