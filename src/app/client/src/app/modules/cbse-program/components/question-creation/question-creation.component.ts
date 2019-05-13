import { Component, OnInit, AfterViewInit, Output, Input, EventEmitter , OnChanges} from '@angular/core';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ActivatedRoute, Router } from '@angular/router';
import {  ConfigService, ResourceService, IUserData, IUserProfile, ToasterService  } from '@sunbird/shared';
import { PublicDataService, UserService, ActionService } from '@sunbird/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';


// tslint:disable-next-line:import-blacklist
import * as _ from 'lodash';
@Component({
  selector: 'app-question-creation',
  templateUrl: './question-creation.component.html',
  styleUrls: ['./question-creation.component.css']
})
export class QuestionCreationComponent implements OnInit, AfterViewInit, OnChanges {
  public userProfile: IUserProfile;
  public publicDataService: PublicDataService;
  private toasterService: ToasterService;
  public resourceService: ResourceService;
  public editorConfig: any;
  questionMetaForm: FormGroup;
  enableSubmitBtn = false;
  public isAssetBrowserReadOnly = false;
  initialized = false;
  public isQuestionFocused: boolean;
  public isAnswerFocused: boolean;
  @Input() tabIndex: any;
  @Input() questionMetaData: any;
  @Output() questionStatus = new EventEmitter < any > ();
  @Input() selectedAttributes: any;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private configService: ConfigService,
    publicDataService: PublicDataService,
    toasterService: ToasterService,
    resourceService: ResourceService,
    public actionService: ActionService
  ) {
    this.userService = userService;
    this.configService = configService;
    this.publicDataService = publicDataService;
    this.toasterService = toasterService;
    this.resourceService = resourceService;
  }
  answer: any;
  question: any;
  editor: any;
  myAssets = [];
  allImages = [];
  showImagePicker: boolean;
  showImageUploadModal: boolean;
  showErrorMsg: boolean;
  errorMsg: string;
  topicName: string;
  ngOnInit() {
    console.log('questionMetaData ', this.questionMetaData);
    this.initialized = true;
    this.editorConfig = { 'mode': 'create' };
    this.initializeFormFields();
    this.userService.userData$.subscribe(
      (user: IUserData) => {
        if (user && !user.err) {
          this.userProfile = user.userProfile;
        }
      });
      this.question = '';
      this.answer = '';
      if (this.questionMetaData.data) {
        this.question = this.questionMetaData.data.body;
        this.answer = this.questionMetaData.data.answers[0];
        this.questionMetaForm.controls.learningOutcome.setValue(this.questionMetaData.data.learningOutcome[0]);
        this.questionMetaForm.controls.bloomsLevel.setValue(this.questionMetaData.data.bloomsLevel[0]);
        this.questionMetaForm.controls.qlevel.setValue(this.questionMetaData.data.qlevel);
        this.questionMetaForm.controls.max_score.setValue(this.questionMetaData.data.max_score);
      }
  }

  ngAfterViewInit() {
    // this.initializeEditors();
    this.initializeDropdown();
  }
  ngOnChanges() {
    if (this.initialized) {
      if (this.questionMetaData.mode === 'edit') {
        // this.isEditorReadOnly(false);
      } else {
        // this.isEditorReadOnly(true);
      }
      this.editorConfig = { 'mode': 'create' };
      this.question = '';
      this.answer = '';
      if (this.questionMetaData && this.questionMetaData.data) {
       this.question = this.questionMetaData.data.body;
        this.answer = this.questionMetaData.data.answers[0];
        this.questionMetaForm.controls.learningOutcome.setValue(this.questionMetaData.data.learningOutcome[0]);
        this.questionMetaForm.controls.bloomsLevel.setValue(this.questionMetaData.data.bloomsLevel[0]);
        this.questionMetaForm.controls.qlevel.setValue(this.questionMetaData.data.qlevel);
        this.questionMetaForm.controls.max_score.setValue(this.questionMetaData.data.max_score);
      } else {
        this.questionMetaForm.reset();
      }
    }
  }

  initializeDropdown() {
    ( < any > $('.ui.checkbox')).checkbox();
  }
  initializeFormFields() {
    this.questionMetaForm = new FormGroup({
      learningOutcome: new FormControl('', Validators.required),
      qlevel: new FormControl('', [Validators.required]),
      bloomsLevel: new FormControl('', [Validators.required]),
      max_score: new FormControl(null, [Validators.required])
    });
  }
  enableSubmitButton() {
    this.questionMetaForm.valueChanges.subscribe(val => {
      this.enableSubmitBtn = (this.questionMetaForm.status === 'VALID');
    });
  }
  validateAllFormFields(questionMetaForm: FormGroup) {
    Object.keys(questionMetaForm.controls).forEach(field => {
      const control = questionMetaForm.get(field);
      if (control instanceof FormControl) {
        control.markAsDirty({
          onlySelf: true
        });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
  createQuestion(event) {
    if (this.questionMetaForm.valid) {
      const req = {
        url: this.configService.urlConFig.URLS.ASSESSMENT.CREATE,
        data: {
          'request': {
            'assessment_item': {
              'objectType': 'AssessmentItem',
              'metadata': {
                'createdBy': this.userProfile.userId,
                'code': this.selectedAttributes.questionType,
                'type': this.selectedAttributes.questionType,
                'category': this.selectedAttributes.questionType.toUpperCase(),
                'itemType': 'UNIT',
                'version': 3,
                'name': this.selectedAttributes.questionType + '_' + this.selectedAttributes.framework,
                'body': this.question,
                'answers': [this.answer],
                'learningOutcome': [this.questionMetaForm.value.learningOutcome],
                'bloomsLevel': [this.questionMetaForm.value.bloomsLevel],
                'qlevel': this.questionMetaForm.value.qlevel,
                'max_score': Number(this.questionMetaForm.value.max_score),
                'template_id': 'NA',
                'framework': this.selectedAttributes.framework,
                'board': this.selectedAttributes.board,
                'medium': this.selectedAttributes.medium,
                'gradeLevel': [
                  this.selectedAttributes.gradeLevel
                ],
                'subject': this.selectedAttributes.subject,
                'topic': [this.selectedAttributes.topic],
                'status': 'Review'
              }
            }
          }
        }
      };
      this.actionService.post(req).subscribe((res) => {
        if (res.responseCode !== 'OK') {
          console.log('Please try again');
          this.questionStatus.emit({'status': 'failed'});
        } else {
          this.questionStatus.emit({'status': 'success', 'identifier': res.result.node_id});
          // this.question_editor.destroy();
          // this.answer_editor.destroy();
        }
      }, error => {
        this.toasterService.error(_.get(error, 'error.params.errmsg') || 'Question creation failed');
      });
    } else {
      this.validateAllFormFields(this.questionMetaForm);
    }
  }
  editorDataHandler(event, type) {
    if (type === 'question') {
      this.question = event;
    } else {
      this.answer = event;
    }
  }

}