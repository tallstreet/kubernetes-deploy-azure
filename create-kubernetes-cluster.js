#!/usr/bin/env node

var azure = require('./lib/azure_wrapper.js');
var kube = require('./lib/deployment_logic/kubernetes.js');

azure.create_config('kube', { 'etcd': 2, 'kubemaster': 1, 'kubeworker': 2});

azure.run_task_queue([
  azure.queue_default_network(),
  azure.queue_storage_if_needed(),
  azure.queue_machines('etcd', 'alpha',
    kube.create_etcd_cloud_config),
  azure.queue_machines('kubemaster', 'alpha',
    kube.create_master_cloud_config),
  azure.queue_machines('kubeworker', 'alpha',
    kube.create_worker_cloud_config),
]);
