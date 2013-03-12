Visualization Component for AudioSens
============

### About

The visualization is completely implemented in Javascript and supporting libraries. Hence, it is very easy to deploy. The current visualization is focused on analyzing speech patterns in users. However, it is very easy to add graphs to visualize other features and inferences. The visualization uses the same credentials as the user's Ohmage account. The administrator of a survey can view data from all the participants in the survey. A normal participant can however only view his/her own data. Some of the visualizations generated are:

<h6>Study Dashboard</h6>
This visualization contains aggregate data for all participants in a study over a time-range. This provides an easy way to check the status of all the participants and is also useful for noticing any anomalies.

<h6>Individual User Analysis</h6>
This visualization contains more detailed graphs about a single user. Some of the graphs under this type are:
<ul>
<li>Summary of an user's Speech over a day.</li>
<li>Summary of a user's speech plotted over a geographical map.</li>
<li>Summary of a user's speech grouped by Semantic locations.</li>
<li>User's Battery graph</li>
<li>list of events related to the application state (such as application restarting, the settings being changed and the phone booting up).</li>

<h6<Comparison between users</h6>
This visualization shows the speech graphs for upto 6 users simulataneously. This can be useful to compare the speech patterns of related subjects (such as members of a family)

<h6>Data view/download</h6>
This provides an easy way to view or download the data as plain JSON.

### Deployment Steps
<ul>
<li>Clone the Project</li>
<li>Set the variable 'ohmageServerUrl' in the file 'ohmage.js'</li>
<li>Set the configuration variables in the top section of the file 'main.js'</li>
<li>Copy the folder to the public directory of a web Server. The web-app should be up and running</li>
</ul>