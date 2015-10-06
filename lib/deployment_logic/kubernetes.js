var _ = require('underscore');
_.mixin(require('underscore.string').exports());

var util = require('../util.js');
var cloud_config = require('../cloud_config.js');

etcd_initial_cluster_conf_kube = function (conf, service) {
  var port = '4001';

  var data = {
    nodes: _(conf.nodes.etcd).times(function (n) {
      var host = util.hostname(n, 'etcd');
      return 'http://' + [host, port].join(':');
    }),
  };

  return {
    'name': service,
    'drop-ins': [{
      'name': '50-etcd-initial-cluster.conf',
      'content': _.template("[Service]\nEnvironment=ETCD_INITIAL_CLUSTER=<%= nodes.join(',') %>\n")(data),
    }],
  };
}

etcd_initial_cluster_conf_self = function (conf) {
  var port = '2380';

  var data = {
    nodes: _(conf.nodes.etcd).times(function (n) {
      var host = util.hostname(n, 'etcd');
      return [host, [host, port].join(':')].join('=http://');
    }),
  };

  return {
    'name': 'etcd2.service',
    'drop-ins': [{
      'name': '50-etcd-initial-cluster.conf',
      'content': _.template("[Service]\nEnvironment=ETCD_INITIAL_CLUSTER=<%= nodes.join(',') %>\n")(data),
    }],
  };
};

exports.create_etcd_cloud_config = function (node_count, conf) {
  var input_file = './cloud_config_templates/kubernetes-cluster-etcd-node-template.yml';
  var output_file = util.join_output_file_path('kubernetes-cluster-etcd-nodes', 'generated.yml');

  return cloud_config.process_template(input_file, output_file, function(data) {
    data.coreos.units.push(etcd_initial_cluster_conf_self(conf));
    return data;
  });
};

exports.create_master_cloud_config = function (node_count, conf) {
  var elected_node = 0;
  var port = '4001';

  var input_file = './cloud_config_templates/kubernetes-cluster-master-node-template.yml';
  var output_file = util.join_output_file_path('kubernetes-cluster-master-node', 'generated.yml');
  
  var etcd_endpoints = {
    nodes: _(conf.nodes.etcd).times(function (n) {
      var host = util.hostname(n, 'etcd');
      return 'http://' + [host, port].join(':');
    }),
  };
  var make_node_config = function (n) {
    return cloud_config.generate_environment_file_entry_from_object(util.hostname(n, 'kubemaster'), {
      pod_network: util.ipv4([10, 2, 0, 0], 16),
      service_ip_range: util.ipv4([10, 3, 0, 0], 24),
      k8s_service_ip: util.ipv4([10, 3, 0, 1]),
      dns_service_ip: util.ipv4([10, 3, 0, 10]),
      bridge_address_cidr: util.ipv4([10, 2, n, 1], 24),
      etcd_endpoints: etcd_endpoints.nodes
    });
  };

  return cloud_config.process_template(input_file, output_file, function(data) {
    data.write_files = data.write_files.concat(_(node_count).times(make_node_config));
    data.coreos.units.push(etcd_initial_cluster_conf_kube(conf, 'kubelet.service'));
    return data;
  });
};


exports.create_worker_cloud_config = function (node_count, conf) {
  var elected_node = 0;
  var port = '4001';

  var input_file = './cloud_config_templates/kubernetes-cluster-worker-nodes-template.yml';
  var output_file = util.join_output_file_path('kubernetes-cluster-worker-nodes', 'generated.yml');
  
  var etcd_endpoints = {
    nodes: _(conf.nodes.etcd).times(function (n) {
      var host = util.hostname(n, 'etcd');
      return 'http://' + [host, port].join(':');
    }),
  };
  var make_node_config = function (n) {
    return cloud_config.generate_environment_file_entry_from_object(util.hostname(n, 'kubeworker'), {
      pod_network: util.ipv4([10, 2, 0, 0], 16),
      service_ip_range: util.ipv4([10, 3, 0, 0], 24),
      k8s_service_ip: util.ipv4([10, 3, 0, 1]),
      dns_service_ip: util.ipv4([10, 3, 0, 10]),
      bridge_address_cidr: util.ipv4([10, 2, n, 1], 24),
      etcd_endpoints: etcd_endpoints.nodes,
      master_host: util.ipv4([172, 12, 0, 6]),
    });
  };

  return cloud_config.process_template(input_file, output_file, function(data) {
    data.write_files = data.write_files.concat(_(node_count).times(make_node_config));
    data.coreos.units.push(etcd_initial_cluster_conf_kube(conf, 'kubelet.service'));
    return data;
  });
};
