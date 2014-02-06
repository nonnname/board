var VProjectsMenu = Backbone.View.extend({
	tagName : "ul",
	className : "dropdown-menu",

	events : {
		"click a" : "projectClick"
	},

	initialize: function() {

		this.listenTo(this.model, "change:me", this.updateProjects);
		this.listenTo(this.model.get('activeProjects'), "add remove", this.updateStates);
	},

	updateProjects : function() {

		var self = this;
		var me = this.model.get("me");

		self.$el.empty();
		if(me) {
			me.get("projects").each(function(project) {
				
				var projectId = project.get('project_id') ;
				project.on("change:iterations", self.onIterationsChanged);

				var $a = $("<a/>").attr("href", "#").text(project.get("project_name")).data("rid", project.id).attr("id", "pm-" + projectId);
				var $badge = $("<span/>").addClass("badge").hide();
				$a.append($badge);

				var $li = $("<li/>").append($a);				
				self.$el.append($li);
			});

			this.updateStates();
		}
	},

	onIterationsChanged : function (project, iterations) {
		
		var projectId = project.get('project_id') ;

		var summ = 0;
		if(iterations) {
			iterations.each(function(iteration){
				summ += iteration.estimate();
			});
		}
		
		$("#pm-" + projectId + " .badge").toggle(!!summ).text(summ);
	},

	projectClick : function(e) {		
		e.preventDefault();

		var $a = $(e.target);
		var rid = $a.data("rid");

		var ap = this.model.get("activeProjects").get(rid);
		if(ap) {
			this.model.get('activeProjects').remove(ap);
		} else {
			var me = this.model.get("me");
			var project = me.get("projects").get(rid);
			this.model.get('activeProjects').add(project);
		}		
	},

	updateStates : function() {
		
		var self = this;
		this.$("a").parent().removeClass("active");

		this.model.get('activeProjects').each(function(project) {
			var projectId = project.get('project_id') ;
			this.$("#pm-" + projectId).parent().addClass("active");
		});
	}
});

var VFilerTypes = Backbone.View.extend({

	events : {
		"click a" : "onClick",
		"mouseover a" : "onOver",
		"mouseout a" : "onOut"
	},

	onClick : function (e) {
		var $a = $(e.target);
		var type = $a.attr("href").substring(1);
		var active = $a.toggleClass("active").hasClass("active");		
		$(".story." + type).toggleClass("hidden-by-type", !active);

		return false;
	},

	onOver : function (e) {
		var $a = $(e.target);
		var type = $a.attr("href").substring(1);
		$(".story").addClass("dismiss");
		$(".story." + type).addClass("highlight");
	},

	onOut : function (e) {
		var $a = $(e.target);
		var type = $a.attr("href").substring(1);
		$(".story").removeClass("dismiss");
		$(".story." + type).removeClass("highlight");
	}

});

var VMember = Backbone.View.extend({
	
	tagName : "a",
	className: "btn btn-primary member",

	events: {
		"click" : "onClick",
		"mouseover" : "onOver",
		"mouseout" : "onOut"
	},

	initialize: function() {

		this.listenTo(this.model, "change", this.render);

		this.render();

		$("#members").append(this.$el);
	},

	stories : function (){
		var person = this.model.get("person");
		return $(".story.owned-by-" + person.id);
	},

	render : function() {		
		this.$el.empty();
		var person = this.model.get("person");
		this.$el.toggleClass("active", this.model.get("active")).text(person.initials);
		this.stories().toggleClass("hidden-by-memer", !this.model.get("active"));
	},

	onClick : function() {
		this.model.set("active", !this.$el.hasClass("active"));
		return false;
	},

	onOver : function () {
		$(".story").addClass("dismiss");
		this.stories().addClass("highlight");
	},

	onOut : function () {
		$(".story").removeClass("dismiss");
		this.stories().removeClass("highlight");
	}

});

var VNav = Backbone.View.extend({
	
	tagName : "nav",
	className : "navbar navbar-default",

	initialize: function() {

		var self = this;

		var token = this.model.storage.get("token");
    	var hash = document.location.hash; 
		
		if(hash[0] == '#') {
			hash = hash.substring(1);
			token = hash; //override token by hash
		}


		this.$el.find("input").val(token);
		this.$el.find("form").submit(function(){
		    var val = this["token"].value;
		    if(!val) return false;
	    	self.model.start(val);
	    	return false;
	  	});

		this.listenTo(this.model, "change:me", this.render);
		
		this.listenTo(this.model.get('activeProjects'), "add remove", this.updateVelocity);
		this.listenTo(this.model.get('activeProjects'), "change:velocity", this.updateVelocity);

		this.render();
  	},

  	render : function() {
  		var me = this.model.get('me');
		this.updateInfo(!!me);
  	},

	updateVelocity : function() {
		var velocity = this.model.get("activeProjects").reduce(function(mem, project){ return mem + project.get("velocity"); }, 0);
	  	this.$(".me .badge").text(velocity.toPrecision(2)).toggle(!!velocity);
	},

  	updateInfo : function(show) {

  		var $projects = this.$(".projects");
  		var $me = this.$(".me");
  		var $form  = this.$('form');

  		show = show || $projects.is(":hidden") || $me.is(":hidden");

  		$projects.toggle(show);
  		$me.toggle(show);
  		$form.toggle(!show);

  		var me = this.model.get('me');
  		if(me) {  			
	  		this.$(".me .name").text(me.get('name'));
  		}  		

  		this.$el.find("button").toggleClass("btn-default", !show).toggleClass("btn-success", show);
  	}
});

var VModalDetails  = Backbone.View.extend({

	initialize : function() {
		this.listenTo(this.model, "change:activeStory", this.updateAndShow);
	},

	updateAndShow : function () {

		var $modal = this.$el;
		var story = this.model.get("activeStory");

		$modal.find(".modal-title").text(story.get("name"));
		$modal.find(".description").html(nl2br(story.get("description")));
		$modal.find(".pivotal").attr("href", story.get("url"));

		var $comments = $modal.find(".comments");
			$comments.empty();

		var self = this;
		story.fetchComments(function(comments){
			comments.each(function(comment){
				if(comment.has("text")) {
					var $comment = $("<li/>").addClass("list-group-item").html(comment.get("text"));
					$comments.append($comment);
				}
			})
		});

		$modal.modal({
			show: true
		});

	}

});

var VStory = Backbone.View.extend({

	tagName : "div",
	className : "story list-group-item",

	events : {
		"click" : "storyClick"
	},

	initialize: function() {
		this.render();
	},

	render : function () {

		var state = this.model.get("current_state");
		var column = this.columnByState(state); 
		
		var projectId = this.model.get("project_id");

		var $type = $("<span/>").addClass("type").text(this.model.get("story_type"));
		var $estimate = $("<span/>").addClass("estimate").addClass("estimate-" + this.model.get("estimate")).text(this.model.get("estimate"));
		var $name = $("<span/>").addClass("name");

		$.each(this.model.get("labels"), function(idx, label){
			var $label = $("<span />").addClass("lbl").text(label.name);
			$name.append($label);
		});
		$name.append(this.model.get("name"));
		
		
		var person = D.personById(this.model.get("owned_by_id"));
		if(person) {		
			var $owner = $("<span/>").addClass("owner").text(person.initials);
			$name.append(" (", $owner, ")");
		}
		
		this.$el.addClass("owned-by-" + this.model.get('owned_by_id')).addClass(this.model.get("story_type"));
		this.$el.append($type).append($estimate).append($name);

		$("#" + column + "-" + projectId).append(this.el);
	},

	columnByState : function(state) {
		// Valid enumeration values: accepted, delivered, finished, started, rejected, unstarted, unscheduled

		switch(state) {
			case "unscheduled": return "todo";
			case "unstarted": return "todo";
			case "started": return "inprogress";
			case "rejected": return "inprogress";
			case "finished": return "testing";
			case "delivered": return "testing";
			case "accepted": return "done";
		}
		return "todo";
	},

	storyClick : function() {		
		D.set("activeStory", this.model);
	}

});

var VIteration = Backbone.View.extend({

	stories: {},

	project: null,

	initialize: function(data) {

		this.project = data.project;
		
		this.listenTo(this.model, "change", this.update);
		this.listenTo(this.model, "destroy", this.remove);

		this.render();
	},

	render : function() {
		var $lg;
		var $mark;
		var projectId = this.project.get('project_id');

		var todoPoints = this.model.estimate(function(story){ return story.get("current_state") == "unstarted"; });
		var inprogressPoints = this.model.estimate(function(story){ return story.get("current_state") == "started" || story.get("current_state") == "rejected"; });
		var testingPoints = this.model.estimate(function(story){ return story.get("current_state") == "finished" || story.get("current_state") == "delivered"; });
		var donePoints = this.model.estimate(function(story){ return story.get("current_state") == "accepted"; });

		$mark = $('<div class="story project-name list-group-item"/>').text(this.project.get("project_name"));

		$lg = $('<div class="list-group"/>').attr("id", "todo-" + projectId).append($mark.clone().append(": ", todoPoints));
		$("#todo").append($lg);
		$lg = $('<div class="list-group"/>').attr("id", "inprogress-" + projectId).append($mark.clone().append(": ", inprogressPoints));
		$("#inprogress").append($lg);
		$lg = $('<div class="list-group"/>').attr("id", "testing-" + projectId).append($mark.clone().append(": ", testingPoints));
		$("#testing").append($lg);
		$lg = $('<div class="list-group"/>').attr("id", "done-" + projectId).append($mark.clone().append(": ", donePoints));
		$("#done").append($lg);

		this.model.get("stories").each(this.renderStory, this);
	},

	renderStory : function(story) {

		//skip release stories
		if(story.get("story_type") == "release") 
			return;

		//skip 0 
		if(story.get("story_type") == "feature" && !story.has("estimate")) 
			return;
		
		var projectId = this.project.get('project_id');

		if(!this.stories[projectId])
			this.stories[projectId] = [];

		this.stories[projectId].push(new VStory({ model: story }));

	},

	remove : function() {		

		var projectId = this.project.get('project_id');

		$(this.stories[projectId]).each(VStory.prototype.remove);

		$("#todo-" + projectId).remove();
		$("#inprogress-" + projectId).remove();
		$("#testing-" + projectId).remove();
		$("#done-" + projectId).remove();

		Backbone.View.prototype.remove.apply(this, arguments);
	},

	update : function() {
		//noop
	}

});

var VProjectSummary = Backbone.View.extend({
	
	initialize: function() {
	}

});

var VMain = Backbone.View.extend({

	tagName : "div",

	iterations : {},
	members : {},

	initialize: function() {

		var self = this;

		this.listenTo(this.model, "change:me", this.layout);
		
		this.listenTo(this.model.get('activeProjects'), "add", this.onProjectAdded);
		this.listenTo(this.model.get('activeProjects'), "remove", this.onProjectRemoved);

		this.listenTo(this.model.get('activeProjects'), "change:members", this.updateMembers);
		this.listenTo(this.model.get('activeProjects'), "change:iterations", this.updateIterations);
	},

	onProjectAdded : function(project) {
		this.layout();

	},

	onProjectRemoved : function(project) {
		this.layout();

		project.get("iterations").each(this.removeIteration, this);	
	},

	layout : function() {
		
		var activeProjects = this.model.get('activeProjects');		

		$("#empty").toggle(!activeProjects.length);
		$("#hello").toggle(!this.model.has("me"));

		$("#main").toggle(!!activeProjects.length);
	},

	updateIterations : function() {

		var self = this;
		var activeProjects = this.model.get('activeProjects');
		
		activeProjects.each(function(project){
			if(project.has("iterations")) {
				project.get("iterations").each(function(iteration){
					self.addIteration(iteration, project);
				}, self);
			}
		});
	},
	
	updateMembers : function() {

		var self = this;
		var activeProjects = this.model.get('activeProjects');		
		activeProjects.each(function(project){
			if(project.has("members")) {
				project.get("members").each(function(member){
					self.addMember(member, project);
				}, self);
			}
		});
	},
	
	removeIteration : function(iteration) {

		var num = iteration.get("number");
		if(this.iterations[num]) {
			this.iterations[num].remove();
			this.iterations[num] = null;
		}
	},

	addIteration : function(iteration, project) {
		
		this.removeIteration(iteration);
		
		var num = iteration.get("number");
		this.iterations[num] = new VIteration({ model : iteration, project : project });
	},

	addMember : function(member, project) {
		
		var id = member.get("person").id;

		if(this.members[id])
			return;
		
		this.members[id] = new VMember({ model : member, project : project });	
	}
});