function clone_obj( src ) {
    return JSON.parse(JSON.stringify( src ))
}

function split_str( str ){
    return (str + "").split(/[\s,]+/)
}

function floatFormat( num ){
    var q = 10 ** 3
    return Math.round( num * q)/ q
}
