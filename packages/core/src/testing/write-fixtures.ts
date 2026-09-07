import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { COLLECTIONS, type Review } from '../model/index.ts';
import { ADVERSARIAL_CASES } from './adversarial.ts';
import { makeCharityExample } from './worked-example-charity.ts';
import { makeGovernmentExample } from './worked-example-government.ts';
import { makeNgoExample } from './worked-example-ngo.ts';
import { makeProductExample } from './worked-example-product.ts';
import { makeProfessionalServicesExample } from './worked-example-professional-services.ts';
import { makeCommercialSaasExample } from './worked-example-saas.ts';
import { makeWorkedExample } from './worked-example.ts';

/**
 * Writes every committed fixture from the code that defines it.
 *
 * The fixtures are run directories so the CLI works against them, which means
 * they can drift from the builders that produced them. Generating them rather
 * than hand editing them makes drift impossible, and fixtures.test.ts asserts
 * the committed copies still match.
 *
 * Deliberately bypasses store.writeCollection: that refuses writes the run
 * stage does not permit, which is exactly right for a real run and exactly
 * wrong for laying down a finished one all at once.
 */

const ROOT = resolve(import.meta.dirname, '..', '..', '..', '..', 'fixtures');

async function writeReview(dir: string, review: Review): Promise<void> {
  await mkdir(join(dir, 'snapshots'), { recursive: true });
  for (const spec of COLLECTIONS) {
    const value = review[spec.key];
    await writeFile(join(dir, spec.file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }
}

export async function writeFixtures(root: string = ROOT): Promise<string[]> {
  const written: string[] = [];

  const personalBrand = join(root, 'personal-brand');
  await writeReview(personalBrand, makeWorkedExample());
  written.push(personalBrand);

  const commercialSaas = join(root, 'commercial-saas');
  await writeReview(commercialSaas, makeCommercialSaasExample());
  written.push(commercialSaas);

  const charity = join(root, 'charity');
  await writeReview(charity, makeCharityExample());
  written.push(charity);

  const ngo = join(root, 'ngo');
  await writeReview(ngo, makeNgoExample());
  written.push(ngo);

  const government = join(root, 'government');
  await writeReview(government, makeGovernmentExample());
  written.push(government);

  const product = join(root, 'product');
  await writeReview(product, makeProductExample());
  written.push(product);

  const professionalServices = join(root, 'professional-services');
  await writeReview(professionalServices, makeProfessionalServicesExample());
  written.push(professionalServices);

  for (const testCase of ADVERSARIAL_CASES) {
    const dir = join(root, 'adversarial', testCase.name);
    await writeReview(dir, testCase.build());
    // Each case says, on disk, what it is for. Without this a reader opening
    // fixtures/adversarial/ finds thirteen valid-looking runs and no clue which
    // rule any of them exists to trip.
    await writeFile(
      join(dir, 'README.md'),
      [
        `# ${testCase.name}`,
        '',
        testCase.problem,
        '',
        `Trips \`${testCase.expect}\` and nothing else.`,
        '',
        'This run passes `validate` completely. That is the point: it is a',
        'well-formed review that a reader should not act on.',
        '',
        '```bash',
        `node packages/core/dist/cli.js validate fixtures/adversarial/${testCase.name}`,
        `node packages/core/dist/cli.js quality  fixtures/adversarial/${testCase.name}`,
        '```',
        '',
      ].join('\n'),
      'utf8',
    );
    written.push(dir);
  }

  return written;
}

// Run directly: node --experimental-strip-types src/testing/write-fixtures.ts
if (process.argv[1] === import.meta.filename) {
  for (const dir of await writeFixtures()) console.log(dir);
}
