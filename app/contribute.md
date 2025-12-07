---
layout: page
title: Contribute
---

This is an unofficial community project to catalogue and document the different digital services UK Government departments have developed and are running.

The project aims to make it easier for digital teams to discover other services – which may be related to the one they are working on – and to improve cross-Government collaboration.

You can contribute to this project by:

- [Adding missing services which you know about](#add-a-missing-service)
- [Updating information about the services listed](#update-information-about-a-service)
- [Improving the presentation of this website](#improve-the-website)

## Add a missing service

If a service you know of is missing, you can add it by following these steps:

1. Visit the list of services in GitHub.
2. Click on the ‘Create new file’ button
3. In the box labelled ‘Name your file’, type in the name of the service you want to add in lowercase, with spaces replaced by hyphens, followed by ‘.json’. For example, `check-your-state-pension.json`.
4. In the larger empty box below, copy and paste the contents of [the service template file](https://raw.githubusercontent.com/x-govuk/govuk-services/main/data/services/_template.json).
5. Replace all the relevant fields with details about the service you’re adding (for example, name and organisation). Any that you don’t know should be left blank.
6. Click the ‘Propose new file’ button
7. Click the ‘Create pull request’ button.

Leave an optional comment, and then press the ‘Create pull request’ button again.
Thanks for your contribution! This will send a public request to our project team to add your service.

We may not reply straight away as this project is run during people’s spare time. We’ll try and respond as soon as we can, either to accept your request and add it to the website, or to ask for some clarifications.

If you spot multiple missing services, repeat this process for each service.

If any part of this process is confusing or your get stuck, you can [create an issue](https://github.com/x-govuk/govuk-services-list/issues) and we will try and help.

## Update information about a service

If the information listed about a service is incorrect, out-of-date, or missing some metadata, please help us update it.

The simplest way to do this is to [create an issue on GitHub](https://github.com/x-govuk/govuk-services-list/issues). You will need to create a free GitHub account first.

If you are more familiar with GitHub and JSON, you can follow these steps to open a pull request:

1. Visit the list of services in GitHub.
2. Find the service you’d like to update. The name of the file will match the last part of the URL. Click on the file name.
3. You should see file containing the current information about that service. Click on the ‘Edit this file’ button, which is displayed as a pencil icon.
4. Update as much of the content as you can
5. Press the ‘Propose file change’ button at the bottom
6. Click the ‘Create pull request’ button.
7. Leave an optional comment, and then press the ‘Create pull request’ button again.

Thanks for your contribution! This will send a public request to our project team to update your service information.

We may not reply straight away as this project is run within people’s spare time. We’ll try and respond as soon as we can, either to accept your changes and update the website, or to ask for some clarifications.

If you spot updates to make for multiple services, repeat this process for each service.

If any part of this process is confusing or your get stuck, you can [create an issue](https://github.com/x-govuk/govuk-services-list/issues) and we will try and help.

## Improve the website

We welcome ideas to improve the presentation or functionality of this website!

The website is a Node.js application. The [source code](https://github.com/x-govuk/govuk-services-list) is available on GitHub.

Please suggest your changes either as a pull request, or via [opening an issue](https://github.com/x-govuk/govuk-services-list/issues).
