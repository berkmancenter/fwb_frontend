sc_require('models/project_model');
sc_require('models/resource_model');
sc_require('models/vocabulary_model');

CWB.RailsDataSource = SC.DataSource.extend({

    // ..........................................................
    // QUERY SUPPORT
    //

    headers: {'Accept': 'application/json'},

    fetch: function (store, query) {
        var recordType = query.get('recordType');

        // if we don't have a project, don't bother looking for folder/file data
        if ((recordType === CWB.Folder || recordType === CWB.File) && window.currentProject === undefined) {
            return NO;
        }

        if (typeof window.hasFetchedData === 'undefined' || !window.hasFetchedData) {
            window.hasFetchedData = {};
        }

        if (window.currentProject && typeof window.hasFetchedData[window.currentProject] === 'undefined') {
            window.hasFetchedData[window.currentProject] = {};
        }

        if(window.currentProject && window.hasFetchedData[window.currentProject][recordType]) {
            if (recordType === CWB.File) {
                if (window.hasFetchedData[window.currentProject]['fetchedFilesTwice']) {
                    // console.log('hijacked! ' + recordType + ' ' + window.currentProject);
                    return YES;
                } else {
                    // don't hijack this because sproutcore is unexplicably missing file data until we fetch files twice
                    window.hasFetchedData[window.currentProject]['fetchedFilesTwice'] = true;
                }
            } else {
                // console.log('hijacked! ' + recordType + ' ' + window.currentProject);
                return YES;
            }
        }
        // console.log('fetching! ' + recordType + ' ' + window.currentProject);

        if(recordType === CWB.Term) {
            SC.Logger.debug('    (Term) recordType: ' + recordType + ' conditions: ' + query.conditions + ' parameters: ' + query.parameters);

            SC.Request.getUrl(this.routeFor(CWB.Vocabulary, store)).header(this.headers)
                .notify(this, 'fetchDidCompleteWithRecordType', store, query, CWB.Vocabulary)
                .json().send();

            SC.Request.getUrl(this.routeFor(CWB.Term, store)).header(this.headers)
                .notify(this, 'fetchDidCompleteWithRecordType', store, query, CWB.Term)
                .json().send();

            if (window.currentProject) {
                window.hasFetchedData[window.currentProject][recordType] = true;
            }
            return YES;
        }

        SC.Logger.debug('CWB.RailsDataSource.fetch - recordType: ' + recordType + ' conditions: ' + query.conditions + ' parameters: ' + query.parameters);

        if (query === CWB.SELECTED_NODES_QUERY) {
            return NO; // TODO
        }
        if (query === CWB.SELECTED_FILES_QUERY) {
            return NO;
        }
        if (SC.kindOf(recordType, CWB.Resource)) {
            SC.Logger.debug('    (general) recordType: ' + recordType + ' conditions: ' + query.conditions + ' parameters: ' + query.parameters);
            
            SC.Request.getUrl(this.routeFor(recordType, store)).header(this.headers)
                .notify(this, 'fetchDidComplete', store, query)
                .json().send();

            if (window.currentProject) {
                window.hasFetchedData[window.currentProject][recordType] = true;
            }
            return YES;
        }
        return NO;
        /* not handled by this data source */
    },

    fetchDidComplete: function (response, store, query) {
        if (SC.ok(response)) {
            var recordType = query.get('recordType');
            var records = response.get('body');
            store.loadRecords(recordType, records);
            store.dataSourceDidFetchQuery(query);
        }
        else {
            store.dataSourceDidErrorQuery(query, response);
        }
    },

    fetchDidCompleteWithRecordType: function (response, store, query, recordType) {
        if (SC.ok(response)) {
            var records = response.get('body');
            store.loadRecords(recordType, records);
            store.dataSourceDidFetchQuery(query);
        }
        else {
            store.dataSourceDidErrorQuery(query, response);
        }
    },

    // ..........................................................
    // RECORD SUPPORT: READ
    //

    retrieveRecord: function (store, storeKey) {
        var recordType = store.recordTypeFor(storeKey);
        if (SC.kindOf(recordType, CWB.Resource)) {
            SC.Request.getUrl(this.routeFor(recordType, store, storeKey)).header(this.headers)
                .notify(this, 'retrieveRecordDidComplete', store, storeKey)
                .json().send();

            return YES;
        }
        return NO;
        /* not handled by this data source */
    },

    retrieveRecordDidComplete: function (response, store, storeKey) {
        if (SC.ok(response)) {
            store.dataSourceDidComplete(storeKey, response.get('body'));
        }
        else {
            store.dataSourceDidError(storeKey, response);
        }
    },

    // ..........................................................
    // RECORD SUPPORT: CREATE
    //

    createRecord: function (store, storeKey) {
        var recordType = store.recordTypeFor(storeKey);
        if (SC.kindOf(recordType, CWB.Resource)) {
            SC.Request.postUrl(this.routeFor(recordType, store)).header(this.headers)
                .notify(this, 'createRecordDidComplete', store, storeKey)
                .json().send(store.readDataHash(storeKey));
            return YES;
        }
        return NO;
        /* not handled by this data source */
    },

    createRecordDidComplete: function (response, store, storeKey) {
        if (SC.ok(response)) {
            store.dataSourceDidComplete(storeKey, null, response.get('body').id);
        }
        else {
            store.dataSourceDidError(storeKey, response);
        }
    },

    // ..........................................................
    // RECORD SUPPORT: UPDATE
    //

    updateRecord: function (store, storeKey) {
        var recordType = store.recordTypeFor(storeKey);
        if (SC.kindOf(recordType, CWB.Resource)) {
            SC.Request.putUrl(this.routeFor(recordType, store, storeKey)).header(this.headers)
                .notify(this, 'updateRecordDidComplete', store, storeKey)
                .json().send(store.readDataHash(storeKey));
            return YES;
        }
        return NO;
        /* not handled by this data source */
    },

    updateRecordDidComplete: function (response, store, storeKey) {
        if (SC.ok(response)) {
            store.dataSourceDidComplete(storeKey, response.get('body'));
        }
        else {
            store.dataSourceDidError(storeKey, response);
        }
    },

    // ..........................................................
    // RECORD SUPPORT: DESTROY
    //

    destroyRecord: function (store, storeKey) {
        var recordType = store.recordTypeFor(storeKey);
        if (SC.kindOf(recordType, CWB.Resource)) {
            SC.Request.deleteUrl(this.routeFor(recordType, store, storeKey)).header(this.headers)
                .notify(this, 'destroyRecordDidComplete', store, storeKey)
                .json().send();
            return YES;
        }
        return NO;
        /* not handled by this data source */
    },

    destroyRecordDidComplete: function (response, store, storeKey) {
        if (SC.ok(response)) {
            store.dataSourceDidDestroy(storeKey);
        }
        else {
            store.dataSourceDidError(storeKey, response);
        }
    },

    // ..........................................................
    // MISCELLANEOUS SUPPORT
    //

    routeFor: function (recordType, store, storeKey) {
        SC.Logger.debug('        (routeFor) recordType: ' + recordType + ' store: ' + store + ' storeKey: ' + storeKey);

        var recordID = (storeKey !== null && storeKey !== undefined ? store.idFor(storeKey) : null);

        if (SC.kindOf(recordType, CWB.Account)) {
           return '/accounts' + (recordID !== null ? '/' + this.encodeID(recordID) : '');
        }
        if (SC.kindOf(recordType, CWB.Project)) {
            return '/projects' + (recordID !== null ? '/' + this.encodeID(recordID) : '');
        }
        if (SC.kindOf(recordType, CWB.Vocabulary)) {
            return '/vocabularies' + (recordID !== null ? '/' + this.encodeID(recordID) : '');
        }
        if (SC.kindOf(recordType, CWB.Term)) {
            //var dataHash = store.readDataHash(storeKey);
            return '/terms' + (recordID !== null ? '/' + this.encodeID(recordID) : ''); // FIXME
        }
        if (SC.kindOf(recordType, CWB.Folder)) {
//            var dataHash = store.readDataHash(storeKey);
            var pid = this.encodeID(CWB.projectController.get('id'));
            var route = '/folders' + (recordID !== null ? '/' + this.encodeID(recordID) : '');
            if(pid) {
                route = '/projects/' + pid + route;                
            }
            SC.Logger.debug('            route: ' + route);
            return route;
        }
        if (SC.kindOf(recordType, CWB.File)) {
//            var dataHash = store.readDataHash(storeKey);
            var pid = this.encodeID(CWB.projectController.get('id'));
            var route = '/files' + (recordID !== null ? '/' + this.encodeID(recordID) : '');
            if(pid) {
                route = '/projects/' + pid + route;
            }
            SC.Logger.debug("            return route: %@".fmt(route));
            return route;
        }
        SC.Logger.log("no route for record type %@".fmt(recordType));
        return null;
    },

    encodeID: function (id) {
        return encodeURIComponent(id);
    }
});
