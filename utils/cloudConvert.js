const axios = require('axios');
const FormData = require('form-data');

const API_KEY = process.env.CLOUDCONVERT_API_KEY;

async function convertToPDF(file) {
  try {
    if (!API_KEY) {
      throw new Error('Missing CLOUDCONVERT_API_KEY');
    }

    const { buffer, mimetype, originalname } = file;

    // ✅ correct mapping (THIS was your real bug)
    const mimeToExt = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls'
    };

    const extension = mimeToExt[mimetype] || 'docx';

    const safeFileName = originalname || `file.${extension}`;

    // 1. Create job
    const jobResponse = await axios.post(
      'https://api.cloudconvert.com/v2/jobs',
      {
        tasks: {
          import_file: {
            operation: 'import/upload'
          },
          convert_file: {
            operation: 'convert',
            input: ['import_file'],
            input_format: extension,
            output_format: 'pdf'
          },
          export_file: {
            operation: 'export/url',
            input: ['convert_file']
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const job = jobResponse.data.data;

    // 2. Get upload task
    const uploadTask = job.tasks.find(t => t.name === 'import_file');

    if (!uploadTask) {
      throw new Error('Upload task not found');
    }

    // 3. Upload file
    const form = new FormData();

    Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
      form.append(key, value);
    });

    form.append('file', buffer, safeFileName);

    await axios.post(uploadTask.result.form.url, form, {
      headers: form.getHeaders()
    });

    // 4. Wait for conversion
    let finishedJob;

    while (true) {
      const res = await axios.get(
        `https://api.cloudconvert.com/v2/jobs/${job.id}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`
          }
        }
      );

      finishedJob = res.data.data;

      if (finishedJob.status === 'finished') break;

      if (finishedJob.status === 'error') {
        console.error('CloudConvert ERROR:', JSON.stringify(finishedJob, null, 2));
        throw new Error('Conversion failed');
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    // 5. Get export task
    const exportTask = finishedJob.tasks.find(t => t.name === 'export_file');

    if (!exportTask?.result?.files?.length) {
      throw new Error('Export failed');
    }

    const fileUrl = exportTask.result.files[0].url;

    // 6. Download PDF
    const pdfResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });

    return pdfResponse.data;

  } catch (err) {
    console.error(
      'FULL ERROR:',
      JSON.stringify(err.response?.data || err.message, null, 2)
    );
    throw err;
  }
}

module.exports = convertToPDF;