+++
date = "2015-03-10"
title = "Scraping The City of Toronto's Council Data"
slug = "2015/03/10/scraping-city-toronto-data"
+++

I am working with two of my classmates to create an API for the City of Toronto's City Council data. We've spent a lot of time discussing the idea, and this week we got down to work.

## Why Are We Doing This?

A couple weeks back, I was chatting with [Matt Elliot][matt] about the stories we might find in this data. He had a great example. Checkout the [SmartTrack Work Plan][st] from February's meeting. You'll notice that the item was adopted 42 - 2. Looks like council loves SmartTrack, right? We'll inside this document you'll see that Gord Perks moved to amend the item. He wanted to delete a number of sections from the SmartTrack study. This motion to amend failed 9 - 35. The vote on this amendment reveals a much more interesting story about council's leaning than the overall result does. 

We're building out this API so that we can start using the data to tell interesting stories about how we engage urban politics on a daily basis.

## The Data
The City of Toronto has an Open Data portal where you can get anything from the Council vote records to shape files for mapping. We are focusing on data related to City Council, so we're interested in Agendas, Minutes, Decision Documents, and votes. The first three items on this list are accessible through the City's website. Navigating the interface to figure out exactly what you're looking at is cumbersome. Figuring out the API is nearly impossible. 

### Agendas
Agendas are posted about one week in advance of a meeting. They outline each item that will be discussed during Council. If a City Council member has given notice that they will be putting forward a motion, you'll see it at the end of this document. 

### Minutes
Minutes outline City Council's everything that happened to an item during the Council meeting. This includes the text of motions to amend, both carried and lost, and the vote record on each item. 

### Decision Documents
The Decision Documents are the items as adopted by City Council. These items do not include the motion history as it was debated. 

### Vote Record
The vote record can be downloaded as a CSV. This includes every recorded vote but unfortunately, not every vote is logged here. The only good thing Rob Ford did for council was to require that while he was in office, every vote gets recorded. 

## Getting the Data

### Council Documents
The first three items come in a beautifully formatted, HTML document with no hierarchy and no semantic class names. It's a dream. If you've never parsed HTML before, you probably missed my sarcasm here. Check out the [agenda for the recent Council meeting last February][feb] to see what I mean. Although these documents have a visual hierarchy, it is extremely difficult to parse the HTML in code. So far we've written a scraper that breaks the document into individual items, and separates out the important identifiers (number, type, title, etc.). 

For these three documents, TMMIS, the city's system that hosts this data, uses queries in the URL. That agenda report above looks like this: 
```
http://app.toronto.ca/tmmis/viewPublishedReport.do?function=getCouncilAgendaReport&meetingId=9688
```
There are two important parts here. `getCouncilAgendaReport` tells us which kind of report we're generating, and which decision body this report is coming from. `meetingId` tells us which meeting we're looking at. We had to write a separate section of the scraper to look at all the meeting in a year to get the meeting IDs. 

### Vote Record
The Vote Record is completely different. Check out [this page][vote] where you can download a CSV of your Councillor's voting record. Here, instead of worrying about HTML, we get to ask the server for a CSV. Parsing this is awesome. When you click the link that says "Download as CSV" on a Councillor's vote record, your browser sends a POST request to the server with some parameters that match the form you've filled out. The server responds with a CSV file. So for this part of the scraper, we are sending out a POST for every City Councillor and saving their CSV. 

### The Database
This will require another post here, but last weekend we spent an afternoon picking through these documents and talking about how Council works to figure out how to represent this in a database. We think that our models represent the real world happenings of city council. 

[feb]: http://app.toronto.ca/tmmis/viewPublishedReport.do?function=getCouncilAgendaReport&meetingId=9688
[vote]: http://app.toronto.ca/tmmis/getAdminReport.do?function=prepareMemberVoteReport
[matt]: https://twitter.com/graphicmatt
[st]: http://app.toronto.ca/tmmis/viewAgendaItemHistory.do?item=2015.EX2.2
