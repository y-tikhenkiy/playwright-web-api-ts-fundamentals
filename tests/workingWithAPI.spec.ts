import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json'

test.beforeEach(async ({page})=>{
    await page.route('*/**/api/tags', async route => {
      await route.fulfill({
        body: JSON.stringify(tags)
      })
  })

  await page.goto('https://conduit.bondaracademy.com/');
  await page.waitForTimeout(500);
  await page.getByText('Sign in').click();
  await page.getByRole('textbox', {name: "Email"}).fill('pwapi@test.com');
  await page.getByRole('textbox', {name: "Password"}).fill('123123');
  await page.getByRole('button').click();

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
  const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user":{"email":"pwapi@test.com","password":"123123"}
    }
  })

  const responseBody = await response.json();
  const accessToken = responseBody.user.token;

  const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
    data: {
      "article":{"title":"This a test title","description":"This is a test description","body":"This a test body","tagList":[]}
    },
    headers:{
      Authorization: `Token ${accessToken}`
    }
  })

  expect(articleResponse.status()).toEqual(201)

  await page.getByText('Global Feed').click();
  await page.getByText('This a test title').click();
  await page.getByRole('button', {name: 'Delete Article'}).first().click();
  await page.getByText('Global Feed').click();

  await expect(page.locator('app-article-list h1').first()).not.toContainText('This a test title');
})
