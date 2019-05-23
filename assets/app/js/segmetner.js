function get_param( idx ){

    var default_param0 = {
      "text": '',
      "model": 'DictSegmenter',
      "mark": ["〔", "〕"],
      'ngram_range': [2,8],
      'esc': ""
    }

    var default_param1 = {
      "text": '治勞役太甚, 或飮食失節, 身熱而煩, 自汗倦怠. 黃芪 一錢半, 人參ㆍ白朮ㆍ甘草 各一錢, 當歸身ㆍ陳皮 各五分, 升麻ㆍ柴胡 各三分. 右剉, 作一貼, 水煎服.',
      "model": 'DictSegmenter',
      "mark": ["〔", "〕"],
      'ngram_range': [2,8],
      'esc': ""
    }

    var default_param2 = {
      "text": '治勞役太甚, 或飮食失節, 身熱而煩, 自汗倦怠. 黃芪 一錢半, 人參ㆍ白朮ㆍ甘草 各一錢, 當歸身ㆍ陳皮 各五分, 升麻ㆍ柴胡 各三分. 右剉, 作一貼, 水煎服.',
      "model": 'ScoreSegmenter',
      "mark": ["〔", "〕"],
      'ngram_range': [2,8],
      'esc': ""
    }

    var default_param3 = {
      "text": '治勞役太甚, 或飮食失節, 身熱而煩, 自汗倦怠. 黃芪 一錢半, 人參ㆍ白朮ㆍ甘草 各一錢, 當歸身ㆍ陳皮 各五分, 升麻ㆍ柴胡 各三分. 右剉, 作一貼, 水煎服.',
      "model": 'NgramTokenizer',
      "mark": ["〔", "〕"],
      'ngram_range': [2,8],
      'esc': ""
    }

    return [default_param0, default_param1, default_param2, default_param3][idx]

}

var app = new Vue({
  el: '#segmenter',
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
  },
  computed: {
      param_sanitized: function( k ){
          return this.param
      },
      print_result: function( ){
          var obj = this.result
          if ( Object.keys( obj ).length === 0 && obj.constructor === Object ){
              return ""
          } else {
              return JSON.stringify( obj, undefined, 4)
          }
      }
  },
  updated: function () {
  },
  methods: {
      // update_component_data: function() {
      //   //console.log('updateComponentData', this.$refs)
      //     this.$refs.child1.open = true
      // },
      apply_param: function( idx ){
          this.default_param_idx = idx
          this.param = get_param( this.default_param_idx )
      },

      ajx_doit: function() {

          console.log( "Method : ajx_doit" )
          this.status.ajx_loading = true;
          // var ajxUrl = api_endpoint + "/collocation?query=" + param2string( this.param )
          // axios.get(ajxUrl)
          axios({
              timeout: 20000,
              method: 'post',
              url: api_endpoint + "/api/segmentation",
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


  }
})
