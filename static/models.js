var Comment = Backbone.Model.extend({

});

var Comments = Backbone.Collection.extend({
	model: Comment,

	constructor: function(data, options) {
    	this.url = 'https://www.pivotaltracker.com/services/v5/projects/' + options.projectId + '/stories/' + options.storyId + '/comments';
    	Backbone.Collection.apply(this, arguments);
  	}
});

var Story = Backbone.Model.extend({

	defaults : {
		comments : null
	},

	fetchComments : function(callback, force) {
		
		if(!force && this.has("comments")) {
			callback(this.get("comments"));
			return;
		}

		var self = this;
		var comments = new Comments([], {			
			projectId : self.get("project_id"),
			storyId : self.get("id")			
		});

		comments.fetch({success : function() {
			self.set("comments", comments);
			callback(comments);
		}});
	}

});

var Stories = Backbone.Collection.extend({	
	model: Story
});

var Iteration = Backbone.Model.extend({

	parse: function(response) {
		var result = response;
		result.stories = new Stories(response.stories);
		return result;
   	},

   	estimate : function(filter) {
   		filter = filter || function(){ return true };
   		return this.get("stories").reduce(function(mem, story){ return mem + (story.has('estimate') && filter(story) ? story.get('estimate') : 0);  }, 0);
   	}

});

var Member = Backbone.Model.extend({
	defaults : {
		active : true
	}
});

var Members = Backbone.Collection.extend({

	model: Member,

	constructor: function(data, options) {
    	this.url = 'https://www.pivotaltracker.com/services/v5/projects/' + options.projectId + '/memberships';
    	Backbone.Collection.apply(this, arguments);
  	}
});

var Iterations = Backbone.Collection.extend({
	
	model: Iteration,

	constructor: function(data, options) {
    	this.url = 'https://www.pivotaltracker.com/services/v5/projects/' + options.projectId + '/iterations?scope=current';
    	Backbone.Collection.apply(this, arguments);
  	}

});

var Project = Backbone.Model.extend({
	defaults : {
		iterations : null,
		members : null
	}
});

var Projects = Backbone.Collection.extend({
	model: Project
});


var Me = Backbone.Model.extend({
	
	url: "https://www.pivotaltracker.com/services/v5/me",

	defaults : {
		projects: new Projects()
	},

	parse: function(response) {
		var result = response;
		result.projects = new Projects(response.projects);
		return result;
   	}

});

var Dashboard = Backbone.Model.extend({

	defaults : {
		me: null,
		activeProjects: new Projects()		
	},

	constructor: function() {

		//load iterations for selected proejcts
		this.on("change:activeProjects", function(self, activeProjects) {
			activeProjects.on("add", function(project) {				
				var iterations = new Iterations([], { projectId : project.get('project_id') });
				iterations.fetch({ success : function() { project.set("iterations", iterations); } });
				var members = new Members([], { projectId : project.get('project_id') });
				members.fetch({ success : function() { project.set("members", members); } });
			});
		});

    	Backbone.Model.apply(this, arguments);
  	},


	start : function(token) {
		
		var self = this;

		$.ajaxSetup({
		    headers: {
        		'X-TrackerToken' : token
    		}
		});
      	
      	self.set('me', null);

		var me = new Me();
		me.fetch({
			success : function() {
      			self.set('me', me);
      			self.get('activeProjects').reset();				
			},
			error : function() {
	      		self.get('activeProjects').reset();
    	  		alert("ME fetch faled");
			}
		});
	}
});