CWB.MANAGING_FILES = SC.State.extend({
  enterState: function() {
    var vocabularyIndex = 0; // FIXME
    CWB.termsController.set('vocabularyIndex', vocabularyIndex);

    var projectID = CWB.projectController.get('id');

    var rootFolders = CWB.store.find(SC.Query.local(CWB.Folder, {
      conditions: 'project.id = %@ AND parent = null',
      parameters: [projectID],
      orderBy: 'name ASC'
    }));

    var rootNode = SC.Object.create(SC.TreeItemContent, {
      treeItemIsGrouped: YES,
      treeItemIsExpanded: YES,
      treeItemChildren: rootFolders,
      count: rootFolders.get('length')
    });

    CWB.filesController.set('content', null);
    CWB.foldersController.set('content', rootNode);
    CWB.foldersController.selectObject(rootFolders.firstObject());

    CWB.getPath('mainPage.mainPane').append();
    CWB.routes.setRoute('files');
//    CWB.routes.setRoute("project/%@/files".fmt(encodeURIComponent(projectID)));
      
  },

  exitState: function() {
    CWB.getPath('mainPage.mainPane').remove();
  },

  showTagPane: function(callback) {
    CWB.mainPage.set('tagPaneIsVisible', YES);
    CWB.mainPage.set('tagPaneCallback', callback);
  },

  downloadRDF: function() {
    window.location.href = '/download?choice=rdfxml';
  },

  downloadTurtle: function() {
    window.location.href = '/download?choice=n3';
  }
});
