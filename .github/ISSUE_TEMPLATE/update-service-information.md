---
name: Update service information
about: Update information or add missing metadata about a service
title: 'Update: '
labels: data
assignees: frankieroberto
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to contribute. You can tell us about existing information that needs to be updated, or any extra information or metadata that is currently missing.
  - type: input
    id: service-name
    attributes:
      label: Service name
    validations:
      required: true
  - type: textarea
    id: details
    attributes:
      label: Details
      description: Describe any changes that need to be made, or information that should be added. This may include the service name, status, URL, description, organisation or topic. You can also add or update links to the service’s start page on GOV.UK, source code, service standard reports, or any official news stories about it.
    validations:
      required: true
---


