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
		result.start = new Date(response.start);
		result.finish = new Date(response.finish);

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
		var scope = options.scope || "current";
		var limit = options.limit || 3;
		var offset = options.offset || -3;

    	this.url = 'https://www.pivotaltracker.com/services/v5/projects/' + options.projectId + '/iterations?scope=' + scope + '&limit='+limit + '&offset='+offset;
    	Backbone.Collection.apply(this, arguments);
  	}

});

var Project = Backbone.Model.extend({
	defaults : {
		iterations : null,
		members : null,
		velocity: 0
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

	constructor: function(options) {

		this.storage = options.storage;

		var self = this;
		//load iterations for selected proejcts
		this.on("change:activeProjects", function(self, activeProjects) {
			self.listenTo(activeProjects, "add", self.fetchProject);
			self.listenTo(activeProjects, "add remove", self.storeActive);
		});

		self.listenTo(this, "change:me", self.restoreActive);
    	
    	Backbone.Model.apply(this, arguments);
  	},
	
	fetchProject : function(project) {
		var projectId = project.get('project_id') 

		var current = new Iterations([], { projectId : projectId });
		current.fetch({ success : function() { project.set("iterations", current); } });
		
		var members = new Members([], { projectId : projectId });
		members.fetch({ success : function() { project.set("members", members); } });

		var done = new Iterations([], { projectId : projectId, scope: "done" });
		done.fetch({ success : function() { 
			
			var total = done.reduce(function(mem, iteration){ return mem + iteration.estimate(); }, 0);
			var avg = total/done.length;

			project.set("velocity", avg);

		}});		
	},

	start : function(token) {
		
		//store token
		this.storage.set('token', token);

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
      			self.get('activeProjects').reset();				
      			self.set('me', me);
			},
			error : function() {
	      		self.get('activeProjects').reset();
    	  		alert("ME fetch faled");
			}
		});		
		
		//refresh projects every 60 seconds
		setInterval(function(){ self.refresh() }, 60000);
	},
	
	refresh : function() {
		var self = this;
		this.get("activeProjects").each(function(project){ 
			self.fetchProject(project); 
		});		
	},

	storeActive : function() {

		var prids = [];
		this.get("activeProjects").each(function(project){
			prids.push(project.id);
		});
		this.storage.set("activeProjects", prids);

	},

	restoreActive : function() {
		var prids = this.storage.get("activeProjects");

		var me = this.get("me");
		if(me) {
			var projects = me.get("projects");
			for(var k in prids) {
				var pid = prids[k];
				var project = projects.get(pid);
				this.get("activeProjects").add(project);
			}
		}
	},

	resetState : function() {

		this.storage.removeAll();
	},
	
	personById : function (id) {
		var person = null;
		
		var activeProjects = this.get("activeProjects");
		if(!activeProjects) return NULL;
		
		activeProjects.each(function(activeProject){
			var members = activeProject.get("members");
			if(!members) return;
			
			members.each(function(member) { 
				if(member.get("person").id == id) {
					person = member.get("person");
					return;
				}
			});
		});
		
		return person;
	}
});