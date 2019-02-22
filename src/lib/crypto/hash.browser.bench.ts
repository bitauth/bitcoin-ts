// tslint:disable:no-expression-statement no-unsafe-any
import test from 'ava';
import { join } from 'path';
import { launch } from 'puppeteer';
import { rollup } from 'rollup';
import alias from 'rollup-plugin-alias';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

const prepareCode = async () => {
  // tslint:disable-next-line:no-unbound-method no-console
  const realConsoleWarn = console.warn;
  /**
   * Suppress Rollup warning: `Use of eval is strongly discouraged, as it poses
   * security risks and may cause issues with minification`
   */
  // tslint:disable-next-line:no-object-mutation no-console
  console.warn = (suppress: string) => suppress;

  const bundle = await rollup({
    // TODO: remove after https://github.com/rollup/rollup/pull/2348 lands
    inlineDynamicImports: false,
    input: join(__dirname, 'hash.browser.bench.helper.js'),
    // tslint:disable-next-line:readonly-array
    plugins: [
      alias({
        chuhai: './../../../bench/chuhai.js',
        'hash.js': './../../../bench/hash.js'
      }),
      commonjs(),
      nodeResolve()
    ]
  });
  // tslint:disable-next-line:no-object-mutation no-console
  console.warn = realConsoleWarn;

  const { code } = await bundle.generate({
    format: 'esm'
  });
  return code;
};

const preparePage = async () => {
  const browser = await launch({
    // tslint:disable-next-line:readonly-array
    args: ['--no-sandbox', '--disable-setuid-sandbox']
    // devtools: true
  });
  const page = await browser.newPage();
  // https://github.com/GoogleChrome/puppeteer/issues/2301#issuecomment-379622459
  await page.goto('file:///');
  return { browser, page };
};

(async () => {
  const [code, { browser, page }] = await Promise.all([
    prepareCode(),
    preparePage()
  ]);

  test(`# browser: ${await browser.version()}`, async t => {
    page.on('console', msg => {
      // tslint:disable-next-line:no-console
      console.log(msg.text());
    });
    page.on('error', err => {
      // tslint:disable-next-line:no-console
      console.error(`error: ${err}`);
    });
    page.on('pageerror', err => {
      // tslint:disable-next-line:no-console
      console.error(`pageerror: ${err}`);
    });
    await new Promise<void>(async resolve => {
      await page.exposeFunction('benchError', (error: string) => {
        // tslint:disable-next-line:no-console
        console.error(error);
      });
      await page.exposeFunction('benchComplete', async () => {
        // tslint:disable-next-line:no-console
        console.log('Browser benchmark complete, closing browser.');
        await browser.close();
        t.pass();
        resolve();
      });
      await page.setContent(`<script type="module">${code}</script>`);
    });
  });
})().catch(err => {
  // tslint:disable-next-line:no-console
  console.error(err);
});
