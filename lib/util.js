var _ = require('underscore');
_.mixin(require('underscore.string').exports());
var openssl = require('openssl-wrapper');
var clr = require('colors');
var util = exports;

exports.ipv4 = function (ocets, prefix) {
  return {
    ocets: ocets,
    prefix: prefix,
    toString: function () {
      return [ocets.join('.'), prefix].join('/');
    }
  }
};

exports.hostname = function hostname (n, prefix) {
  return _.template("<%= pre %>-<%= seq %>")({
    pre: prefix || 'core',
    seq: _.pad(n, 2, '0'),
  });
};

exports.rand_string = function () {
  var crypto = require('crypto');
  var shasum = crypto.createHash('sha256');
  shasum.update(crypto.randomBytes(256));
  return shasum.digest('hex');
};


exports.rand_suffix = exports.rand_string().substring(50);

exports.join_output_file_path = function(prefix, suffix) {
  return './output/' + [prefix, exports.rand_suffix, suffix].join('_');
};


exports.gen_keys = function (callback) {
  var prefix = '';
  var opts = {
    out: util.join_output_file_path(prefix, 'ca-key.pem'),
    '2048': false
  };
  openssl.exec('genrsa', opts, function (err, buffer) {
    if (err) console.log(clr.red(err));
    
    var opts = {
      "-new": false,
      "-nodes": false,
      days: 10000,
      "-x509": false,
      key: util.join_output_file_path(prefix, 'ca-key.pem'),
      out: util.join_output_file_path(prefix, 'ca.pem'),
      subj: '/CN=kube-ca'
    };
    openssl.exec('req', opts, function (err, buffer) {
      if (err) console.log(clr.red(err));
      
      var opts = {
        out: util.join_output_file_path(prefix, 'apiserver-key.pem'),
        '2048': false
      };
      openssl.exec('genrsa', opts, function (err, buffer) {
        if (err) console.log(clr.red(err));
        
        var opts = {
          "-new": false,
          key: util.join_output_file_path(prefix, 'apiserver-key.pem'),
          out: util.join_output_file_path(prefix, 'apiserver.csr'),
          subj: '/CN=kube-apiserver',
          config: 'openssl.cnf'
        };
        openssl.exec('req', opts, function (err, buffer) {
          if (err) console.log(clr.red(err));
          
          var opts = {
            in: util.join_output_file_path(prefix, 'apiserver.csr'),
            CA: util.join_output_file_path(prefix, 'ca.pem'),
            CAkey: util.join_output_file_path(prefix, 'ca-key.pem'),
            "-CAcreateserial": false,
            "-req": false,
            out: util.join_output_file_path(prefix, 'apiserver.pem'),
            extensions: 'v3_req',
            extfile: 'openssl.cnf',
            days: 365
          };
          openssl.exec('x509', opts, function (err, buffer) {
            if (err) console.log(clr.red(err));
          });
        });
      });
      
      
      
      
      
      var opts = {
        out: util.join_output_file_path(prefix, 'worker-key.pem'),
        '2048': false
      };
      openssl.exec('genrsa', opts, function (err, buffer) {
        if (err) console.log(clr.red(err));
      
        var opts = {
          "-new": false,
          key: util.join_output_file_path(prefix, 'worker-key.pem'),
          out: util.join_output_file_path(prefix, 'worker.csr'),
          subj: '/CN=kube-worker'
        };
        openssl.exec('req', opts, function (err, buffer) {
          if (err) console.log(clr.red(err));
          

          var opts = {
            in: util.join_output_file_path(prefix, 'worker.csr'),
            CA: util.join_output_file_path(prefix, 'ca.pem'),
            CAkey: util.join_output_file_path(prefix, 'ca-key.pem'),
            "-CAcreateserial": false,
            "-req": false,
            out: util.join_output_file_path(prefix, 'worker.pem'),
            days: 365
          };
          openssl.exec('x509', opts, function (err, buffer) {
            if (err) console.log(clr.red(err));
          });
        });
      });



      var opts = {
        out: util.join_output_file_path(prefix, 'admin-key.pem'),
        '2048': false
      };
      openssl.exec('genrsa', opts, function (err, buffer) {
        if (err) console.log(clr.red(err));
      
        var opts = {
          "-new": false,
          key: util.join_output_file_path(prefix, 'admin-key.pem'),
          out: util.join_output_file_path(prefix, 'admin.csr'),
          subj: '/CN=kube-admin'
        };
        openssl.exec('req', opts, function (err, buffer) {
          if (err) console.log(clr.red(err));
          

          var opts = {
            in: util.join_output_file_path(prefix, 'admin.csr'),
            CA: util.join_output_file_path(prefix, 'ca.pem'),
            CAkey: util.join_output_file_path(prefix, 'ca-key.pem'),
            "-CAcreateserial": false,
            "-req": false,
            out: util.join_output_file_path(prefix, 'admin.pem'),
            days: 365
          };
          openssl.exec('x509', opts, function (err, buffer) {
            if (err) console.log(clr.red(err));
            callback();
          });
        });
      });
    });
    
  });
  



};
