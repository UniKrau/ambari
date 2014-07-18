/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var App = require('app');

App.HighAvailabilityWizardController = App.WizardController.extend({

  name: 'highAvailabilityWizardController',

  totalSteps: 9,

  /**
   * Used for hiding back button in wizard
   */
  hideBackButton: true,

  content: Em.Object.create({
    controllerName: 'highAvailabilityWizardController',
    cluster: null,
    hosts: null,
    services: null,
    slaveComponentHosts: null,
    masterComponentHosts: null,
    serviceConfigProperties: [],
    serviceName: 'MISC',
    hdfsUser:"hdfs",
    nameServiceId: '',
    failedTask : null
  }),

  setCurrentStep: function (currentStep, completed) {
    this._super(currentStep, completed);
    App.clusterStatus.setClusterStatus({
      clusterName: this.get('content.cluster.name'),
      clusterState: 'HIGH_AVAILABILITY_DEPLOY',
      wizardControllerName: 'highAvailabilityWizardController',
      localdb: App.db.data
    });
  },

  /**
   * return new object extended from clusterStatusTemplate
   * @return Object
   */
  getCluster: function(){
    return jQuery.extend({}, this.get('clusterStatusTemplate'), {name: App.router.getClusterName()});
  },

  /**
   * save status of the cluster.
   * @param clusterStatus object with status,requestId fields.
   */
  saveClusterStatus: function (clusterStatus) {
    var oldStatus = this.toObject(this.get('content.cluster'));
    clusterStatus = jQuery.extend(oldStatus, clusterStatus);
    if (clusterStatus.requestId) {
      clusterStatus.requestId.forEach(function (requestId) {
        if (clusterStatus.oldRequestsId.indexOf(requestId) === -1) {
          clusterStatus.oldRequestsId.push(requestId)
        }
      }, this);
    }
    this.set('content.cluster', clusterStatus);
    this.save('cluster');
  },

  /**
   * Save Master Component Hosts data to Main Controller
   * @param stepController App.WizardStep5Controller
   */
  saveMasterComponentHosts: function (stepController) {
    var obj = stepController.get('selectedServicesMasters');
    var masterComponentHosts = [];
    obj.forEach(function (_component) {
      masterComponentHosts.push({
        display_name: _component.get('display_name'),
        component: _component.get('component_name'),
        hostName: _component.get('selectedHost'),
        serviceId: _component.get('serviceId'),
        isCurNameNode: _component.get('isCurNameNode'),
        isAddNameNode: _component.get('isAddNameNode'),
        isInstalled: true
      });
    });
    this.setDBProperty('masterComponentHosts', masterComponentHosts);
    this.set('content.masterComponentHosts', masterComponentHosts);
  },

  saveHdfsUser: function () {
    App.db.setHighAvailabilityWizardHdfsUser(this.get('content.hdfsUser'));
  },

  saveTasksStatuses: function(statuses){
    App.db.setHighAvailabilityWizardTasksStatuses(statuses);
    this.set('content.tasksStatuses', statuses);
  },

  saveConfigTag: function(tag){
    App.db.setHighAvailabilityWizardConfigTag(tag);
    this.set('content.'+[tag.name], tag.value);
  },

  saveHdfsClientHosts: function(hostNames){
    App.db.setHighAvailabilityWizardHdfsClientHosts(hostNames);
    this.set('content.hdfsClientHostNames', hostNames);
  },

    /**
     * Save config properties
     * @param stepController HighAvailabilityWizardStep3Controller
     */
  saveServiceConfigProperties: function(stepController) {
    var serviceConfigProperties = [];
    var data = stepController.get('serverConfigData');

    var _content = stepController.get('stepConfigs')[0];
    _content.get('configs').forEach(function (_configProperties) {
      var siteObj = data.items.findProperty('type', _configProperties.get('filename'));
      if (siteObj) {
        siteObj.properties[_configProperties.get('name')] = _configProperties.get('value');
      }
    }, this);
    this.setDBProperty('serviceConfigProperties', data);
    this.set('content.serviceConfigProperties', data);
  },

  loadHdfsClientHosts: function(){
    var hostNames = App.db.getHighAvailabilityWizardHdfsClientHosts();
    if (!(hostNames instanceof Array)) {
      hostNames = [hostNames];
    }
    this.set('content.hdfsClientHostNames', hostNames);
  },

  loadConfigTag: function(tag){
    var tagVal = App.db.getHighAvailabilityWizardConfigTag(tag);
    this.set('content.'+tag, tagVal);
  },


  loadHdfsUser: function(){
    var hdfsUser = App.db.getHighAvailabilityWizardHdfsUser();
    this.set('content.hdfsUser', hdfsUser);
  },

  loadTasksStatuses: function(){
    var statuses = App.db.getHighAvailabilityWizardTasksStatuses();
    this.set('content.tasksStatuses', statuses);
  },

  /**
   * Load serviceConfigProperties to model
   */
  loadServiceConfigProperties: function () {
    var serviceConfigProperties = this.getDBProperty('serviceConfigProperties');
    this.set('content.serviceConfigProperties', serviceConfigProperties);
  },

  saveRequestIds: function(requestIds){
    App.db.setHighAvailabilityWizardRequestIds(requestIds);
    this.set('content.requestIds', requestIds);
  },

  loadRequestIds: function(){
    var requestIds = App.db.getHighAvailabilityWizardRequestIds();
    this.set('content.requestIds', requestIds);
  },

  saveNameServiceId: function(nameServiceId){
    App.db.setHighAvailabilityWizardNameServiceId(nameServiceId);
    this.set('content.nameServiceId', nameServiceId);
  },

  loadNameServiceId: function(){
    var nameServiceId = App.db.getHighAvailabilityWizardNameServiceId();
    this.set('content.nameServiceId', nameServiceId);
  },

  saveTasksRequestIds: function (requestIds) {
    App.db.setHighAvailabilityWizardTasksRequestIds(requestIds);
    this.set('content.tasksRequestIds', requestIds);
  },

  loadTasksRequestIds: function () {
    var requestIds = App.db.getHighAvailabilityWizardTasksRequestIds();
    this.set('content.tasksRequestIds', requestIds);
  },

  /**
   * Load data for all steps until <code>current step</code>
   */
  loadAllPriorSteps: function () {
    var step = this.get('currentStep');
    switch (step) {
      case '9':
      case '8':
      case '7':
      case '6':
      case '5':
        this.loadTasksStatuses();
        this.loadTasksRequestIds();
        this.loadRequestIds();
      case '4':
      case '3':
        this.loadNameServiceId();
        this.loadServiceConfigProperties();
      case '2':
        this.loadServicesFromServer();
        this.loadMasterComponentHosts();
        this.loadConfirmedHosts();
        this.loadHdfsUser();
      case '1':
        this.load('cluster');
    }
  },

  /**
   * Remove all loaded data.
   * Created as copy for App.router.clearAllSteps
   */
  clearAllSteps: function () {
    this.clearInstallOptions();
    // clear temporary information stored during the install
    this.set('content.cluster', this.getCluster());
  },

  clearTasksData: function () {
    this.saveTasksStatuses(undefined);
    this.saveRequestIds(undefined);
    this.saveTasksRequestIds(undefined);
  },

  /**
   * Clear all temporary data
   */
  finish: function () {
    App.db.data.HighAvailabilityWizard = {};
    App.db.data.Installer = {};
    App.router.get('updateController').updateAll();
  }
});
