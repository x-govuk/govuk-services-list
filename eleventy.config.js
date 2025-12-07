import { govukEleventyPlugin } from '@x-govuk/govuk-eleventy-plugin'

export default function(eleventyConfig) {

  const serviceName = 'GOV.UK Services list'

  // Register the plugin
  eleventyConfig.addPlugin(govukEleventyPlugin, {
    templates: {
    },
    header: {
    },
    footer: {
      meta: {
        items: [
          {
            text: 'Domains',
            href: '/domains'
          },
          {
            text: 'Screenshots',
            href: '/screenshots'
          },
          {
            text: 'Verbs',
            href: '/verbs'
          },
          {
            text: 'Original 25 exemplar services',
            href: '/original-25-exemplars'
          },
          {
            text: 'Top 75 services',
            href: '/top-75'
          },
          {
            text: 'GOV.UK One Login',
            href: '/govuk-one-login'
          }
        ]
      }
    },
    serviceNavigation: {
      serviceName,
      serviceUrl: '/',
      navigation: [
        {
          text: 'A to Z',
          href: '/a-z'
        },
        {
          text: 'By topic',
          href: '/topic'
        },
        {
          text: 'By organisation',
          href: '/organisation'
        },
        {
          text: 'By phase',
          href: '/phase'
        },
        {
          text: 'Contribute',
          href: '/contribute'
        }
      ]
    },
    stylesheets: ['/assets/stylesheets/application.css'],
    themeColor: '#2288aa'
  })

  // Enable X-GOVUK brand
  eleventyConfig.addNunjucksGlobal('xGovuk', true)


  // Collections
  // eleventyConfig.addCollection('post', (collection) => {
  //   return collection.getFilteredByGlob('app/posts/*.md')
  // })

  // Pass through
  eleventyConfig.addPassthroughCopy('./app/assets/images')

  return {
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dir: {
      input: 'app',
      includes: '_includes',
      data: '../data'
    }
  }
};
