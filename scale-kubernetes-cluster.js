#!/usr/bin/env node

var azure = require('./lib/azure_wrapper.js');
var kube = require('./lib/deployment_logic/kubernetes.js');

azure.load_state_for_resizing(process.argv[2], 'kubeworker', parseInt(process.argv[3] || 1));

azure.run_task_queue([
  azure.queue_machines('kubeworker', 'alpha', function() { return './output/kubernetes-cluster-worker-nodes_d2f6f75c2cd206_generated.yml' }),
]);
