
import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 10
describe('Mutation: createAddress', () => {
    var id = '';
    const mutationName = 'createCheckoutAttribute';
    const deleteMutName = "deleteCheckoutAttribute";
    const queryName = "checkoutAttributes";
    const itemPath = 'checkoutAttribute';
    const standardMutationBody = `
        code
        message
        errors {
            code
            message
            domain
            details {
                code
                message
                target
            }
        }
        ${itemPath} {
            id
            name
            values {
                name
            }
        }
    `;
    var taxCategoryId = "";


    var deleteItemsAfter = undefined as boolean | undefined;

    afterEach(() => {
    });
});