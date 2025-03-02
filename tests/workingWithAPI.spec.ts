import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach(async ({page})=>{
    await page.route('*/**/api/tags', async route => {
      await route.fulfill({
        body: JSON.stringify(tags)
      })
  })

  await page.goto('https://conduit.bondaracademy.com/');
})

test('article has modified title and description', async ({ page }) => {
  await page.route('*/**/api/articles*', async route =>{
    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.articles[0].title = "This is a Mock test title";
    responseBody.articles[0].description = "This is a Mock test descriprion";
    
    await route.fulfill({
      body:JSON.stringify(responseBody)
    })
  })

  await page.getByText('Global Feed').click();

  await expect(page.locator('.navbar-brand')).toHaveText('conduit');

  await expect(page.locator('app-article-list h1').first()).toContainText('This is a Mock test title');
  await expect(page.locator('app-article-list p').first()).toContainText('This is a Mock test descriprion');
});

test('delete article', async({page, request}) =>{
  //commeted due to made auth from pw config
  // const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
  //   data: {
  //     "user":{"email":"pwapi@test.com","password":"123123"}
  //   }
  // })

  // const responseBody = await response.json();
  // const accessToken = responseBody.user.token;

  const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
    data: {
      "article":{"title":"This a test title","description":"This is a test description","body":"This a test body","tagList":[]}
    }
    //commeted due to made auth from pw config
    // headers:{
    //   Authorization: `Token ${accessToken}`
    // }
  })

  expect(articleResponse.status()).toEqual(201);

  await page.getByText('Global Feed').click();
  await page.getByText('This a test title').click();
  await page.getByRole('button', {name: 'Delete Article'}).first().click();
  await page.getByText('Global Feed').click();

  await expect(page.locator('app-article-list h1').first()).not.toContainText('This a test title');
})

test('create article', async({page, request})=>{
  await page.getByText("New article").click();
  await page.getByRole('textbox',{name: 'Article Title'}).fill('This is a test article');
  await page.getByRole('textbox',{name: 'What\'s this article about?'}).fill('This is a test description');
  await page.getByRole('textbox',{name: 'Write your article (in markdown)'}).fill('This is a test body');
  await page.getByRole('button',{name: 'Publish Article'}).click();

  const articleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/');
  const articleResponseBody = await articleResponse.json();
  console.log(articleResponseBody);
  const slugId = articleResponseBody.article.slug;

  await expect(page.locator('.article-page h1')).toContainText('This is a test article');
  
  await page.getByText('Home').click();
  await page.getByText('Global Feed').click();

  await expect(page.locator('app-article-list h1').first()).toContainText('This is a test article');

  //commeted due to made auth from pw config
  // const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
  //   data: {
  //     "user":{"email":"pwapi@test.com","password":"123123"}
  //   }
  // })

  // const responseBody = await response.json();
  // const accessToken = responseBody.user.token;

  const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}` 
  // {
    //commeted due to made auth from pw config
    // headers:{
    //   Authorization: `Token ${accessToken}`
    // }
  // }
  )

  expect(deleteArticleResponse.status()).toEqual(204);

})