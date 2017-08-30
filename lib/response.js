function createResponse(msg, options) {
    options = options || {};
    return Object.assign({message: msg}, options)
}

exports.Response = {
    error: function(msg, options) {
        var res = createResponse(msg, options);
        res.status = 'err';

        return JSON.stringify(res);
    },
    success: function(msg, options) {
        var res = createResponse(msg, options);
        res.status = 'ok';

        return JSON.stringify(res);
    }
};
